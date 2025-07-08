import { Database } from "../database";
import logger from "../logger";

const User = require("../models/User");
const Expense = require("../models/Expense");
const FraudDetector = require("../utils/fraudDetection");

// Clear existing data
const clearDatabase = async (): Promise<void> => {
  try {
    await User.deleteMany({});
    await Expense.deleteMany({});
    logger.info("Database cleared");
  } catch (error) {
    logger.error("Error clearing database:", error);
  }
};

// Seed users
const seedUsers = async (): Promise<any[]> => {
  const users = [
    {
      username: "admin1",
      email: "admin@company.com",
      password: "Admin123!",
      firstName: "Admin",
      lastName: "User",
      department: "IT",
      role: "administrator",
    },
    {
      username: "john_doe",
      email: "john.doe@company.com",
      password: "Employee123!",
      firstName: "John",
      lastName: "Doe",
      department: "Sales",
      role: "employee",
    },
    {
      username: "jane_smith",
      email: "jane.smith@company.com",
      password: "Employee123!",
      firstName: "Jane",
      lastName: "Smith",
      department: "Marketing",
      role: "employee",
    },
    {
      username: "bob_johnson",
      email: "bob.johnson@company.com",
      password: "Employee123!",
      firstName: "Bob",
      lastName: "Johnson",
      department: "Finance",
      role: "employee",
    },
    {
      username: "alice_wilson",
      email: "alice.wilson@company.com",
      password: "Employee123!",
      firstName: "Alice",
      lastName: "Wilson",
      department: "HR",
      role: "employee",
    },
  ];

  try {
    const createdUsers = await User.create(users);
    logger.info(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    logger.error("Error seeding users:", error);
    return [];
  }
};

// Seed expenses
const seedExpenses = async (users: any[]): Promise<void> => {
  const employees = users.filter((user) => user.role === "employee");
  const admin = users.find((user) => user.role === "administrator");

  if (employees.length === 0) {
    logger.info("No employees found, skipping expense seeding");
    return;
  }

  const categories = [
    "meals",
    "transportation",
    "accommodation",
    "office_supplies",
    "travel",
    "entertainment",
    "other",
  ];
  const descriptions = [
    "Business lunch with client",
    "Taxi to airport",
    "Hotel accommodation for conference",
    "Office supplies for team",
    "Flight tickets for business trip",
    "Team dinner",
    "Parking fees",
    "Conference registration",
    "Office furniture",
    "Client entertainment",
    "Uber ride to meeting",
    "Restaurant bill for business meeting",
    "Gas for company car",
    "Stationery supplies",
    "Coffee with potential client",
  ];

  const expenses = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Random date within last 30 days
    const randomDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    // Random amount between 10 and 1000
    let randomAmount = Math.floor(Math.random() * 990) + 10;

    // Make some amounts suspicious (same amounts for fraud detection)
    if (i % 10 === 0) {
      randomAmount = 250; // Common suspicious amount
    }

    const expense = {
      userId: randomEmployee._id,
      amount: randomAmount,
      category: randomCategory,
      description: randomDescription,
      date: randomDate,
      status: "pending",
    };

    expenses.push(expense);
  }

  // Create some suspicious expenses for fraud detection testing
  const suspiciousExpenses = [
    // Duplicate amounts within 60 minutes
    {
      userId: employees[0]._id,
      amount: 125.5,
      category: "meals",
      description: "Business lunch",
      date: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      status: "pending",
    },
    {
      userId: employees[0]._id,
      amount: 125.5,
      category: "meals",
      description: "Another business lunch",
      date: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
      status: "pending",
    },
    // High amount expenses
    {
      userId: employees[1]._id,
      amount: 1500,
      category: "travel",
      description: "Expensive flight ticket",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "pending",
    },
    {
      userId: employees[1]._id,
      amount: 5500,
      category: "accommodation",
      description: "Luxury hotel stay",
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: "pending",
    },
    // Round number expenses
    {
      userId: employees[2]._id,
      amount: 500,
      category: "entertainment",
      description: "Team event",
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: "pending",
    },
    {
      userId: employees[2]._id,
      amount: 1000,
      category: "office_supplies",
      description: "Office equipment",
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      status: "pending",
    },
  ];

  expenses.push(...suspiciousExpenses);

  try {
    const createdExpenses = await Expense.create(expenses);
    logger.info(`Created ${createdExpenses.length} expenses`);

    // Run fraud detection on all expenses
    for (const expense of createdExpenses) {
      const fraudResult = await FraudDetector.detectFraud(expense);
      if (fraudResult.isFlagged) {
        expense.isFlagged = true;
        expense.flagReason = fraudResult.reason;
        expense.flaggedAt = new Date();
        await expense.save();
      }
    }

    // Approve some expenses
    const expensesToApprove = createdExpenses.slice(0, 15);
    for (const expense of expensesToApprove) {
      expense.status = "approved";
      expense.reviewedBy = admin._id;
      expense.reviewedAt = new Date();
      expense.reviewNotes = "Approved automatically during seeding";
      await expense.save();
    }

    // Reject some expenses
    const expensesToReject = createdExpenses.slice(15, 20);
    for (const expense of expensesToReject) {
      expense.status = "rejected";
      expense.reviewedBy = admin._id;
      expense.reviewedAt = new Date();
      expense.reviewNotes = "Rejected - insufficient documentation";
      await expense.save();
    }

    logger.info("Fraud detection completed and some expenses approved/rejected");
  } catch (error) {
    logger.error("Error seeding expenses:", error);
  }
};

// Main seed function
const seedDatabase = async (): Promise<void> => {
  try {
    const database = Database.getInstance();
    await database.connect();

    await clearDatabase();

    logger.info("Starting database seeding...");

    const users = await seedUsers();
    if (users.length > 0) {
      await seedExpenses(users);
    }

    logger.info("Database seeding completed successfully!");
    logger.info("\nTest Users:");
    logger.info("Admin: admin1 / Admin123!");
    logger.info("Employee: john_doe / Employee123!");
    logger.info("Employee: jane_smith / Employee123!");
    logger.info("Employee: bob_johnson / Employee123!");
    logger.info("Employee: alice_wilson / Employee123!");
  } catch (error) {
    logger.error("Error seeding database:", error);
  } finally {
    const database = Database.getInstance();
    await database.getConnection().close();
    logger.info("Database connection closed");
  }
};

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, clearDatabase, seedUsers, seedExpenses };
