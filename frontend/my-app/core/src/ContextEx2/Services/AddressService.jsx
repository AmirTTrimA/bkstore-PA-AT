import ApiClient from "./ApiClient";

const AddressService = {
  getAddresses: async () => {
    return ApiClient.get("/auth/addresses/");
  },

  createAddress: async (data) => {
    return ApiClient.post("/auth/addresses/", data);
  },

  updateAddress: async (id, data) => {
    return ApiClient.patch(`/auth/addresses/${id}/`, data);
  },

  deleteAddress: async (id) => {
    return ApiClient.delete(`/auth/addresses/${id}/`);
  },
};

export default AddressService;
