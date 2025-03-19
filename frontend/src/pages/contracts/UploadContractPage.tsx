import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
  Stack,
} from "@mui/material";
import { UploadFile, CloudUpload, Delete, Code } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import { ContractService } from "../../services/api.service";

const UploadContractPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: "",
    version: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Check file extension
    if (!selectedFile.name.endsWith(".sol")) {
      setFileError("Please upload a Solidity (.sol) file");
      setFile(null);
      setFileName("");
      return;
    }

    // Check file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5MB limit");
      setFile(null);
      setFileName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (
        !content.includes("pragma solidity") &&
        !content.includes("contract ")
      ) {
        setFileError("The file doesn't appear to be a valid Solidity contract");
        setFile(null);
        setFileName("");
        return;
      }

      // File is valid, proceed
      setFileError("");
      setFile(selectedFile);
      setFileName(selectedFile.name);
    };
    reader.onerror = () => {
      setFileError("Error reading file");
      setFile(null);
      setFileName("");
    };
    reader.readAsText(selectedFile);
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    let valid = true;
    const errors = {
      name: "",
      version: "",
    };

    // Validate name
    if (!name) {
      errors.name = "Contract name is required";
      valid = false;
    }

    // Validate version
    if (!version) {
      errors.version = "Version is required";
      valid = false;
    } else if (!/^\d+\.\d+\.\d+$/.test(version)) {
      errors.version = "Version must be in the format x.x.x";
      valid = false;
    }

    // Check if file is selected
    if (!file) {
      setFileError("Please select a file to upload");
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append("contract", file as File);
    formData.append("name", name);
    formData.append("version", version);

    if (description) {
      formData.append("description", description);
    }

    try {
      setLoading(true);
      setError("");

      // Simulate progress (in a real app, you would use an upload progress event)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);

      // Upload contract
      const result = await ContractService.uploadContract(formData);

      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success message
      setSuccess(true);

      // Navigate to the contract page after a delay
      setTimeout(() => {
        navigate(`/contracts/${result.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload contract");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <AnimatedElement animation="slideUp">
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Upload Smart Contract
        </Typography>
        <Typography variant="h6" sx={{ mb: 4 }} color="text.secondary">
          Upload a Solidity contract file to analyze for security
          vulnerabilities and optimization opportunities
        </Typography>
      </AnimatedElement>

      {success ? (
        <AnimatedElement animation="scale">
          <Alert severity="success" variant="filled" sx={{ mb: 4 }}>
            <AlertTitle>Success!</AlertTitle>
            Contract uploaded successfully. Redirecting to contract page...
          </Alert>
        </AnimatedElement>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* File Upload Section */}
            <Grid item xs={12} md={6}>
              <AnimatedElement animation="slideUp" delay={0.1}>
                <GlassCard sx={{ height: "100%" }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Contract File
                  </Typography>

                  <Box
                    sx={{
                      border: "2px dashed",
                      borderColor: isDragging
                        ? "primary.main"
                        : "text.secondary",
                      borderRadius: 2,
                      p: 4,
                      textAlign: "center",
                      transition: "all 0.3s ease",
                      backgroundColor: isDragging
                        ? "rgba(45, 212, 191, 0.05)"
                        : "transparent",
                      cursor: "pointer",
                      mb: 3,
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      accept=".sol"
                    />

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {file ? (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 2,
                            }}
                          >
                            <Code
                              sx={{
                                fontSize: 60,
                                color: "primary.main",
                                mr: 2,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="h6"
                            gutterBottom
                            fontWeight="bold"
                          >
                            {fileName}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {(file.size / 1024).toFixed(2)} KB
                          </Typography>
                          <Button
                            startIcon={<Delete />}
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remove File
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <CloudUpload
                            sx={{
                              fontSize: 60,
                              color: "text.secondary",
                              mb: 2,
                            }}
                          />
                          <Typography variant="h6" gutterBottom>
                            Drag & Drop your contract file here
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            or click to browse
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Supports .sol files up to 5MB
                          </Typography>
                        </Box>
                      )}
                    </motion.div>
                  </Box>

                  {fileError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {fileError}
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    Your contract will be securely analyzed for vulnerabilities,
                    gas optimization opportunities, and standard compliance. All
                    contract data is encrypted during transmission.
                  </Typography>
                </GlassCard>
              </AnimatedElement>
            </Grid>

            {/* Contract Details Section */}
            <Grid item xs={12} md={6}>
              <AnimatedElement animation="slideUp" delay={0.2}>
                <GlassCard>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Contract Details
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label="Contract Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Version"
                        fullWidth
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        required
                        error={!!formErrors.version}
                        helperText={
                          formErrors.version ||
                          "Use semantic versioning (e.g., 1.0.0)"
                        }
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Description (Optional)"
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel id="analysis-options-label">
                          Analysis Options
                        </InputLabel>
                        <Select
                          labelId="analysis-options-label"
                          id="analysis-options"
                          value="all"
                          label="Analysis Options"
                          disabled={loading}
                        >
                          <MenuItem value="all">
                            All Checks (Recommended)
                          </MenuItem>
                          <MenuItem value="security">Security Only</MenuItem>
                          <MenuItem value="gas">Gas Optimization Only</MenuItem>
                          <MenuItem value="compliance">
                            Compliance Only
                          </MenuItem>
                          <MenuItem value="custom">Custom Settings</MenuItem>
                        </Select>
                        <FormHelperText>
                          Select which analysis components to run
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2}>
                        <GradientButton
                          type="submit"
                          variant="contained"
                          gradient="primary"
                          size="large"
                          startIcon={
                            loading ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <UploadFile />
                            )
                          }
                          disabled={loading}
                          fullWidth
                        >
                          {loading
                            ? `Uploading... ${uploadProgress}%`
                            : "Upload & Analyze"}
                        </GradientButton>

                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => navigate("/contracts")}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </GlassCard>
              </AnimatedElement>
            </Grid>
          </Grid>
        </form>
      )}

      {/* Additional Information Section */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <AnimatedElement animation="slideUp" delay={0.3}>
            <GlassCard glowColor="primary">
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                fontWeight="bold"
              >
                Security Scan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detects vulnerabilities such as reentrancy attacks, integer
                overflows, access control flaws, and other common security
                issues.
              </Typography>
            </GlassCard>
          </AnimatedElement>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedElement animation="slideUp" delay={0.4}>
            <GlassCard glowColor="secondary">
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                fontWeight="bold"
              >
                Gas Optimization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Identifies opportunities to reduce gas costs by optimizing
                storage layout, loop operations, and other gas-intensive
                patterns.
              </Typography>
            </GlassCard>
          </AnimatedElement>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedElement animation="slideUp" delay={0.5}>
            <GlassCard glowColor="tertiary">
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                fontWeight="bold"
              >
                Compliance Check
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verifies compliance with ERC-20, ERC-721, and other blockchain
                standards to ensure compatibility with existing systems.
              </Typography>
            </GlassCard>
          </AnimatedElement>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UploadContractPage;
