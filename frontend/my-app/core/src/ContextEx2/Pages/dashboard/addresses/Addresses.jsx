import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";

import NewAddresses from "./NewAddresses";
import Notification from "../../../Components/feature/Notification";
import AddressService from "../../../Services/AddressService";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const notificationRef = useRef();

  // Load addresses from backend API
  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await AddressService.getAddresses();
      const list = response.data?.results || response.data || [];
      setAddresses(list);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      setError("Failed to load shipping addresses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Open modal for new address
  const handleAddNew = () => {
    setEditingAddress(null);
    setAddModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (addr) => {
    setEditingAddress(addr);
    setAddModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingAddress(null);
    setAddModalOpen(false);
  };

  // Save address (create or update)
  const handleSaveAddress = async (addressData, isEditing, editingId) => {
    try {
      setSaving(true);
      if (isEditing && editingId) {
        await AddressService.updateAddress(editingId, addressData);
        notificationRef.current?.showNotif("Address updated successfully!", "success");
      } else {
        await AddressService.createAddress(addressData);
        notificationRef.current?.showNotif("Address added successfully!", "success");
      }
      handleCloseModal();
      await loadAddresses();
    } catch (err) {
      console.error("Failed to save address:", err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.recipient_name?.[0] ||
        err.response?.data?.address_line?.[0] ||
        "Could not save address. Please try again.";
      notificationRef.current?.showNotif(errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const handleDelete = async (id) => {
    try {
      await AddressService.deleteAddress(id);
      notificationRef.current?.showNotif("Address removed.", "info");
      setDeleteConfirmId(null);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
      notificationRef.current?.showNotif("Could not delete address.", "error");
    }
  };

  // Set default address
  const handleSetDefault = async (id) => {
    try {
      await AddressService.updateAddress(id, { is_default: true });
      notificationRef.current?.showNotif("Default address updated.", "success");
      await loadAddresses();
    } catch (err) {
      console.error("Failed to set default address:", err);
      notificationRef.current?.showNotif("Failed to update default address.", "error");
    }
  };

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3
        }}
      >
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-primarys)" }}>
            📍 Saved Addresses
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", mt: 0.5 }}>
            Manage delivery locations for physical book orders.
          </Typography>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{
            backgroundColor: "#d17842",
            color: "#fff",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            px: 2.5,
            py: 1,
            "&:hover": { backgroundColor: "#b35e2e" }
          }}
        >
          Add New Address
        </Button>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#d17842" }} />
        </Box>
      )}

      {/* Error state */}
      {!loading && error && (
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: "#ef5350",
            textAlign: "center"
          }}
        >
          <Typography>{error}</Typography>
          <Button
            onClick={loadAddresses}
            variant="outlined"
            size="small"
            sx={{ mt: 2, color: "#ef5350", borderColor: "#ef5350" }}
          >
            Retry
          </Button>
        </Box>
      )}

      {/* Empty state */}
      {!loading && !error && addresses.length === 0 && (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px dashed rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            my: 2
          }}
        >
          <LocationOnIcon sx={{ fontSize: 56, color: "rgba(255, 255, 255, 0.3)", mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
            No delivery addresses saved yet
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 3 }}>
            Add your shipping address so you can order physical books without retyping during checkout.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              backgroundColor: "#d17842",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#b35e2e" }
            }}
          >
            Add Address Now
          </Button>
        </Box>
      )}

      {/* Addresses Grid */}
      {!loading && !error && addresses.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fill, minmax(320px, 1fr))"
            },
            gap: 2.5
          }}
        >
          {addresses.map((address) => (
            <Card
              key={address.id}
              sx={{
                background: "rgba(30, 30, 30, 0.65)",
                backdropFilter: "blur(10px)",
                border: address.is_default
                  ? "1.5px solid #d17842"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                transition: "all 0.25s ease",
                boxShadow: address.is_default
                  ? "0 8px 24px rgba(209, 120, 66, 0.18)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
                  borderColor: address.is_default ? "#d17842" : "rgba(255, 255, 255, 0.2)"
                }
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                {/* Card Header: Title + Badges */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1.5
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "#fff" }}
                    >
                      {address.title || "Address"}
                    </Typography>
                    {address.is_default && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                        label="Default"
                        size="small"
                        sx={{
                          bgcolor: "rgba(209, 120, 66, 0.2)",
                          color: "#d17842",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          border: "1px solid rgba(209, 120, 66, 0.4)",
                          height: "22px"
                        }}
                      />
                    )}
                  </Box>

                  {/* Actions (Edit / Delete) */}
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(address)}
                      sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        "&:hover": { color: "#d17842", bgcolor: "rgba(209, 120, 66, 0.1)" }
                      }}
                      title="Edit Address"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteConfirmId(address.id)}
                      sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        "&:hover": { color: "#ef5350", bgcolor: "rgba(239, 83, 80, 0.1)" }
                      }}
                      title="Delete Address"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Recipient & Contact */}
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 600, mb: 0.5 }}
                >
                  {address.recipient_name}
                </Typography>

                {address.phone_number && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
                    <PhoneIcon sx={{ fontSize: 15, color: "rgba(255, 255, 255, 0.4)" }} />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255, 255, 255, 0.6)", direction: "ltr" }}
                    >
                      {address.phone_number}
                    </Typography>
                  </Box>
                )}

                {/* Full Address Details */}
                <Box
                  sx={{
                    background: "rgba(255, 255, 255, 0.03)",
                    p: 1.5,
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    my: 1.5
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#eee", mb: 0.5, lineHeight: 1.5 }}>
                    {address.province} • {address.city}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.85rem" }}>
                    {address.address_line}
                  </Typography>
                  {address.postal_code && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "rgba(255, 255, 255, 0.5)", mt: 0.5 }}
                    >
                      Postal Code: {address.postal_code}
                    </Typography>
                  )}
                </Box>

                {/* Card Footer */}
                {!address.is_default && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleSetDefault(address.id)}
                    sx={{
                      color: "#d17842",
                      textTransform: "none",
                      fontSize: "0.82rem",
                      p: 0,
                      "&:hover": { background: "none", textDecoration: "underline" }
                    }}
                  >
                    ★ Set as Default Address
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add / Edit Modal */}
      {addModalOpen && (
        <NewAddresses
          open={addModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveAddress}
          editingAddress={editingAddress}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{
          sx: {
            background: "#1e1e1e",
            color: "#fff",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.1)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Address?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)" }}>
            Are you sure you want to remove this saved shipping address? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirmId(null)}
            sx={{ color: "#aaa" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirmId)}
            variant="contained"
            color="error"
            sx={{ fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Notification ref={notificationRef} />
    </Box>
  );
}