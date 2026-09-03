import followUpService from "../services/followUpService.js";

export const getAllFollowUps = async (req, res) => {
  try {
    const rows = await followUpService.getAllFollowUps();

    const data = rows.map((row) => ({
      id: row.id,
      relatedType: row.lead_id !== null ? "Lead" : "Quotation",
      relatedId: row.lead_id !== null ? row.lead_id : row.quotation_id,
      followUpDate: row.follow_up_date,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
    }));

    res.json(data);
  } catch (err) {
    console.error("❌ Get follow-ups error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const followUp = await followUpService.createFollowUp(req.body);

    const data = {
      id: followUp.id,
      relatedType:
        followUp.lead_id !== null ? "Lead" : "Quotation",
      relatedId:
        followUp.lead_id !== null
          ? followUp.lead_id
          : followUp.quotation_id,
      followUpDate: followUp.follow_up_date,
      notes: followUp.notes,
      status: followUp.status,
      createdAt: followUp.created_at,
    };

    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Create follow-up error:", err);

    res.status(400).json({
      error: err.message,
    });
  }
};