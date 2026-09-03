import followUpRepository from "../repositories/followUpRepository.js";

const getAllFollowUps = async () => {
  return await followUpRepository.getAllFollowUps();
};

const createFollowUp = async (data) => {
  const {
    relatedType,
    relatedId,
    followUpDate,
    notes,
    status,
  } = data;

  if (!relatedType) {
    throw new Error("relatedType is required");
  }

  if (!["Lead", "Quotation"].includes(relatedType)) {
    throw new Error("relatedType must be Lead or Quotation");
  }

  if (!relatedId) {
    throw new Error("relatedId is required");
  }

  if (!followUpDate) {
    throw new Error("followUpDate is required");
  }

  return await followUpRepository.createFollowUp({
    relatedType,
    relatedId,
    followUpDate,
    notes,
    status,
  });
};

export default {
  getAllFollowUps,
  createFollowUp,
};