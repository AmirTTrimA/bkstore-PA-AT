import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from "@mui/material";
import { IRAN_PROVINCES, IRAN_CITIES_BY_PROVINCE } from "../../../utils/iranLocations";
import { useLanguage } from "../../../Context/LanguageContext";

const PHONE_REGEX = /^09\d{9}$/;
const POSTCODE_REGEX = /^\d{10}$/;
const MIN_NAME_LENGTH = 2;
const MIN_ADDRESS_LENGTH = 5;

export default function Manually({
  notificationRef,
  onSave,
  editingAddress,
  isEditing,
  onCancel,
  saving = false
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    recipient_name: "",
    phone_number: "",
    province: "",
    city: "",
    address_line: "",
    postal_code: "",
    is_default: false
  });

  const [errors, setErrors] = useState({});

  // Initialize editing data
  useEffect(() => {
    if (editingAddress && isEditing) {
      setFormData({
        title: editingAddress.title || "",
        recipient_name: editingAddress.recipient_name || "",
        phone_number: editingAddress.phone_number || "",
        province: editingAddress.province || "",
        city: editingAddress.city || "",
        address_line: editingAddress.address_line || "",
        postal_code: editingAddress.postal_code || "",
        is_default: Boolean(editingAddress.is_default)
      });
    } else {
      setFormData({
        title: "",
        recipient_name: "",
        phone_number: "",
        province: "",
        city: "",
        address_line: "",
        postal_code: "",
        is_default: false
      });
    }
    setErrors({});
  }, [editingAddress, isEditing]);

  // Derived available cities based on chosen province
  const availableCities = useMemo(() => {
    if (!formData.province) return [];
    return IRAN_CITIES_BY_PROVINCE[formData.province] || [];
  }, [formData.province]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value
      };
      // Reset city when province changes
      if (name === "province") {
        next.city = "";
      }
      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  const validate = () => {
    const newErrors = {};

    if (!formData.recipient_name?.trim()) {
      newErrors.recipient_name = "Recipient name is required.";
    } else if (formData.recipient_name.trim().length < MIN_NAME_LENGTH) {
      newErrors.recipient_name = `Name must be at least ${MIN_NAME_LENGTH} characters.`;
    }

    if (!formData.province) {
      newErrors.province = "Please select a province.";
    }

    if (!formData.city) {
      newErrors.city = "Please select a city.";
    }

    if (!formData.address_line?.trim()) {
      newErrors.address_line = "Address line is required.";
    } else if (formData.address_line.trim().length < MIN_ADDRESS_LENGTH) {
      newErrors.address_line = `Address must be at least ${MIN_ADDRESS_LENGTH} characters.`;
    }

    if (formData.phone_number?.trim() && !PHONE_REGEX.test(formData.phone_number.trim())) {
      newErrors.phone_number = "Enter a valid 11-digit Iranian mobile (e.g. 09121234567).";
    }

    if (formData.postal_code?.trim() && !POSTCODE_REGEX.test(formData.postal_code.trim())) {
      newErrors.postal_code = "Postal code must be exactly 10 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      notificationRef?.current?.showNotif?.("Please resolve form errors.", "error");
      return;
    }

    onSave({
      title: formData.title.trim() || "Address",
      recipient_name: formData.recipient_name.trim(),
      phone_number: formData.phone_number.trim(),
      province: formData.province,
      city: formData.city,
      address_line: formData.address_line.trim(),
      postal_code: formData.postal_code.trim(),
      is_default: formData.is_default
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        {/* Address Title */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.addressTitle", "Address Title (e.g. Home, Office)")}
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Home, Office, Studio"
            size="small"
          />
        </Grid>

        {/* Recipient Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label={t("dashboard.recipient", "Recipient Full Name")}
            name="recipient_name"
            value={formData.recipient_name}
            onChange={handleChange}
            error={Boolean(errors.recipient_name)}
            helperText={errors.recipient_name}
            size="small"
          />
        </Grid>

        {/* Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.phone", "Phone Number")}
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="0912xxxxxxx"
            error={Boolean(errors.phone_number)}
            helperText={errors.phone_number}
            size="small"
          />
        </Grid>

        {/* Postal Code */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.postalCode", "Postal Code (10 digits)")}
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="1234567890"
            error={Boolean(errors.postal_code)}
            helperText={errors.postal_code}
            size="small"
          />
        </Grid>

        {/* Province Select */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={Boolean(errors.province)} required>
            <InputLabel id="province-select-label">{t("dashboard.province", "Province")}</InputLabel>
            <Select
              labelId="province-select-label"
              id="province-select"
              name="province"
              value={formData.province}
              label={t("dashboard.province", "Province")}
              onChange={handleChange}
            >
              <MenuItem value="" disabled>
                <em>{t("dashboard.selectProvince", "Select Province")}</em>
              </MenuItem>
              {IRAN_PROVINCES.map((prov) => (
                <MenuItem key={prov.id} value={prov.id}>
                  {prov.name}
                </MenuItem>
              ))}
            </Select>
            {errors.province && (
              <Box sx={{ color: "#f44336", fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                {errors.province}
              </Box>
            )}
          </FormControl>
        </Grid>

        {/* City Select */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={Boolean(errors.city)} required>
            <InputLabel id="city-select-label">{t("dashboard.city", "City")}</InputLabel>
            <Select
              labelId="city-select-label"
              id="city-select"
              name="city"
              value={formData.city}
              label={t("dashboard.city", "City")}
              onChange={handleChange}
              disabled={!formData.province || availableCities.length === 0}
            >
              <MenuItem value="" disabled>
                <em>
                  {!formData.province
                    ? t("dashboard.selectProvinceFirst", "Select province first")
                    : t("dashboard.selectCity", "Select City")}
                </em>
              </MenuItem>
              {availableCities.map((cityName) => (
                <MenuItem key={cityName} value={cityName}>
                  {cityName}
                </MenuItem>
              ))}
            </Select>
            {errors.city && (
              <Box sx={{ color: "#f44336", fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                {errors.city}
              </Box>
            )}
          </FormControl>
        </Grid>

        {/* Address Line */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label={t("dashboard.street", "Street Address / Alley / Unit / Plate")}
            name="address_line"
            value={formData.address_line}
            onChange={handleChange}
            placeholder="Detailed street address, building number, floor and unit"
            error={Boolean(errors.address_line)}
            helperText={errors.address_line}
            size="small"
          />
        </Grid>

        {/* Is Default */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_default}
                onChange={handleChange}
                name="is_default"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-checked": { color: "#d17842" }
                }}
              />
            }
            label={t("dashboard.setAsDefault", "Set as default shipping address")}
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        {onCancel && (
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
            sx={{
              color: "#aaa",
              borderColor: "rgba(255,255,255,0.2)",
              "&:hover": { borderColor: "rgba(255,255,255,0.4)" }
            }}
          >
            {t("common.cancel", "Cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          sx={{
            backgroundColor: "#d17842",
            color: "#fff",
            fontWeight: "bold",
            px: 3,
            "&:hover": { backgroundColor: "#b35e2e" }
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
              {t("common.saving", "Saving...")}
            </>
          ) : isEditing ? (
            t("common.save", "Update Address")
          ) : (
            t("common.save", "Save Address")
          )}
        </Button>
      </Box>
    </Box>
  );
}
