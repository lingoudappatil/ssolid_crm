// server/routes/quotationRoutes.js

import express from "express";
import PDFDocument from "pdfkit";

import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
} from "../controllers/quotationController.js";

import quotationService from "../services/quotationService.js";

const router = express.Router();


// ==========================================
// ADD NEW QUOTATION
// ==========================================
router.post("/", createQuotation);


// ==========================================
// GET ALL QUOTATIONS
// ==========================================
router.get("/", getAllQuotations);


// ==========================================
// GET SINGLE QUOTATION
// ==========================================
router.get("/:id", getQuotationById);


// ==========================================
// EXPORT QUOTATION AS PDF
// ==========================================
router.get("/:id/export", async (req, res) => {
  try {
    const quotation =
      await quotationService.getQuotationById(
        req.params.id
      );

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found",
      });
    }

    const quotationNumber = `Q-${String(
      quotation.quotation_id
    ).padStart(5, "0")}`;

    const doc = new PDFDocument();

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation-${quotationNumber}.pdf`
    );

    doc.pipe(res);

    // ======================================
    // PDF HEADER
    // ======================================

    doc
      .fontSize(20)
      .text("Quotation", {
        align: "center",
      })
      .moveDown();

    doc
      .fontSize(12)
      .text(
        `Quotation No: ${quotationNumber}`
      );

    doc
      .text(
        `Date: ${new Date(
          quotation.quotation_date
        ).toLocaleDateString()}`
      )
      .moveDown();


    // ======================================
    // CUSTOMER DETAILS
    // ======================================

    doc
      .fontSize(14)
      .text("Customer Details")
      .moveDown();

    doc
      .fontSize(12)
      .text(
        `Name: ${quotation.customer_name || ""}`
      )
      .text(
        `Email: ${quotation.email || ""}`
      )
      .text(
        `Phone: ${quotation.phone || ""}`
      )
      .text(
        `Address: ${quotation.address || ""}`
      )
      .text(
        `State: ${quotation.state || ""}`
      )
      .moveDown();


    // ======================================
    // ITEMS
    // ======================================

    doc
      .fontSize(14)
      .text("Items")
      .moveDown();

    for (
      let index = 0;
      index < quotation.items.length;
      index++
    ) {
      const item =
        quotation.items[index];

      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${item.item_name}`
        )
        .text(
          `Qty: ${item.qty}, Price: ₹${item.price}, Subtotal: ₹${item.subtotal}`
        )
        .moveDown();
    }


    // ======================================
    // TOTAL
    // ======================================

    doc
      .fontSize(14)
      .text(
        `Total Amount: ₹${quotation.total_amount}`,
        {
          align: "right",
        }
      );

    doc.end();

  } catch (error) {
    console.error(
      "❌ Error generating quotation PDF:",
      error
    );

    res.status(500).json({
      error: "Failed to generate PDF",
    });
  }
});


export default router;