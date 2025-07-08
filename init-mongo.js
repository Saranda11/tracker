// MongoDB initialization script for Expense Tracker

// Switch to the expense-tracker database
db = db.getSiblingDB("expense-tracker");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "password", "firstName", "lastName", "role"],
      properties: {
        username: {
          bsonType: "string",
          description: "Username must be a string and is required",
        },
        email: {
          bsonType: "string",
          description: "Email must be a string and is required",
        },
        password: {
          bsonType: "string",
          description: "Password must be a string and is required",
        },
        firstName: {
          bsonType: "string",
          description: "First name must be a string and is required",
        },
        lastName: {
          bsonType: "string",
          description: "Last name must be a string and is required",
        },
        role: {
          bsonType: "string",
          enum: ["employee", "administrator"],
          description: "Role must be either employee or administrator",
        },
        department: {
          bsonType: "string",
          description: "Department must be a string",
        },
        isActive: {
          bsonType: "bool",
          description: "isActive must be a boolean",
        },
      },
    },
  },
});

db.createCollection("expenses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "amount", "category", "description", "date"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "User ID must be an ObjectId and is required",
        },
        amount: {
          bsonType: "number",
          minimum: 0.01,
          maximum: 10000,
          description: "Amount must be a number between 0.01 and 10000",
        },
        category: {
          bsonType: "string",
          enum: ["meals", "transportation", "accommodation", "office_supplies", "travel", "entertainment", "other"],
          description: "Category must be one of the predefined values",
        },
        description: {
          bsonType: "string",
          maxLength: 500,
          description: "Description must be a string with max 500 characters",
        },
        date: {
          bsonType: "date",
          description: "Date must be a valid date",
        },
        status: {
          bsonType: "string",
          enum: ["pending", "approved", "rejected"],
          description: "Status must be pending, approved, or rejected",
        },
        isFlagged: {
          bsonType: "bool",
          description: "isFlagged must be a boolean",
        },
      },
    },
  },
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.expenses.createIndex({ userId: 1, date: -1 });
db.expenses.createIndex({ status: 1 });
db.expenses.createIndex({ isFlagged: 1 });
db.expenses.createIndex({ userId: 1, amount: 1, date: 1 }); // For fraud detection
db.expenses.createIndex({ category: 1 });
db.expenses.createIndex({ createdAt: -1 });

print("Database initialization completed successfully");
print("Collections created: users, expenses");
print("Indexes created for optimal performance");
print("Validation rules applied for data integrity");
