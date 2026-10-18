import {
  getLeadStatuses,
  getLeadSources,
  getLeadLostReasons
} from "../services/leadMasterService.js";

export const getStatuses = async (req, res) => {
  try {
    const statuses = await getLeadStatuses();

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching lead statuses:", error);

    res.status(500).json({
      error: "Failed to fetch lead statuses"
    });
  }
};

export const getSources = async (req, res) => {
  try {
    const sources = await getLeadSources();

    res.status(200).json(sources);
  } catch (error) {
    console.error("Error fetching lead sources:", error);

    res.status(500).json({
      error: "Failed to fetch lead sources"
    });
  }
};

export const getLostReasons = async (req, res) => {
  try {
    const reasons = await getLeadLostReasons();

    res.status(200).json(reasons);
  } catch (error) {
    console.error("Error fetching lead lost reasons:", error);

    res.status(500).json({
      error: "Failed to fetch lead lost reasons"
    });
  }
};