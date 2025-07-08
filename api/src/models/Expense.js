const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 10000, // Maximum expense amount
    },
    category: {
      type: String,
      required: true,
      enum: ["meals", "transportation", "accommodation", "office_supplies", "travel", "entertainment", "other"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Fraud detection fields
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      trim: true,
    },
    flaggedAt: {
      type: Date,
    },
    // Additional metadata for fraud detection
    metadata: {
      duplicateCheck: {
        type: Boolean,
        default: false,
      },
      similarExpenses: [
        {
          expenseId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
          similarity: Number,
          timeDifference: Number, // in minutes
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ isFlagged: 1 });
expenseSchema.index({ userId: 1, amount: 1, date: 1 }); // For fraud detection

// Method to flag as suspicious
expenseSchema.methods.flagAsSuspicious = function (reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedAt = new Date();
  return this.save();
};

// Method to approve expense
expenseSchema.methods.approve = function (reviewerId, notes = "") {
  this.status = "approved";
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

// Method to reject expense
expenseSchema.methods.reject = function (reviewerId, notes = "") {
  this.status = "rejected";
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

module.exports = mongoose.model("Expense", expenseSchema);
