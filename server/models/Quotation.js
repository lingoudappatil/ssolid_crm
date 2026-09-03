  // server/models/Quotation.js
  import mongoose from "mongoose";
  import Counter from "./Counter.js";

  // Quotation Schema (supports dynamic items & customFields)
  const quotationSchema = new mongoose.Schema({
    quotationId: { type: Number, unique: true, index: true },

    // Customer Info
    customerName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    state: { type: String },

    // Items Array
    items: [
      {
        itemName: { type: String, required: true },
        qty: { type: Number, required: true, min: 0 },
        unit: { type: String },
        price: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        tax: { type: Number, default: 0, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],

    // Total & Custom Fields
    totalAmount: { type: Number, required: true, min: 0 },
    customFields: { type: Object, default: {} },

    // Date
    date: { type: Date, default: Date.now },
  }, { timestamps: true }); // ✅ adds createdAt, updatedAt

  // Auto-increment quotationId before save
  quotationSchema.pre("save", async function (next) {
    try {
      if (this.quotationId == null) {
        const counter = await Counter.findOneAndUpdate(
          { id: "quotationId" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        this.quotationId = counter.seq;
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // Virtual: formatted quotation number
  quotationSchema.virtual("quotationNumber").get(function () {
    if (this.quotationId == null) return null;
    return `Q-${String(this.quotationId).padStart(5, "0")}`;
  });

  // Include virtuals when converting to JSON
  quotationSchema.set("toJSON", { virtuals: true });
  quotationSchema.set("toObject", { virtuals: true });

  export default mongoose.model("Quotation", quotationSchema);
