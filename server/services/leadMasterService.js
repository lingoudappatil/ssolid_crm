import {
  getAllLeadStatuses,
  getAllLeadSources,
  getAllLeadLostReasons,
  getLeadStatusById
} from "../repositories/leadMasterRepository.js";

export const getLeadStatuses = async () => {
  return await getAllLeadStatuses();
};

export const getLeadSources = async () => {
  return await getAllLeadSources();
};

export const getLeadLostReasons = async () => {
  return await getAllLeadLostReasons();
};
