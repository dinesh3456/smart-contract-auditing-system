import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  InputAdornment,
  TextField,
  LinearProgress,
  Button,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Link as MuiLink,
  IconButton,
  Tooltip,
  MenuItem,
  Menu,
  Pagination,
} from "@mui/material";
import {
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";

// Define vulnerability data structure
interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  impact: string;
  category: string;
  codeExample: string;
  fixExample: string;
  references: string[];
}

// Severity Chip Component
interface SeverityChipProps {
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
}

const SeverityChip: React.FC<SeverityChipProps> = ({ severity }) => {
  const colorMap = {
    Critical: "error",
    High: "error",
    Medium: "warning",
    Low: "success",
    Informational: "info",
  };

  return (
    <Chip label={severity} color={colorMap[severity] as any} size="small" />
  );
};

// Code Example Component
interface CodeExampleProps {
  code: string;
  title: string;
}

const CodeExample: React.FC<CodeExampleProps> = ({ code, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {title}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy code"}>
          <IconButton size="small" onClick={handleCopyCode}>
            <CopyIcon fontSize="small" color={copied ? "success" : "inherit"} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          bgcolor: "rgba(0, 0, 0, 0.3)",
          p: 2,
          borderRadius: 1,
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: "0.875rem",
          whiteSpace: "pre",
        }}
        aria-label={`${title} code example`}
      >
        {code}
      </Box>
    </Box>
  );
};

// Vulnerability Detail Card Component
interface VulnerabilityDetailProps {
  vulnerability: Vulnerability;
}

const VulnerabilityDetail: React.FC<VulnerabilityDetailProps> = ({
  vulnerability,
}) => {
  return (
    <GlassCard sx={{ mt: 3, mb: 4 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h2" fontWeight="bold">
            {vulnerability.name}
          </Typography>
          <SeverityChip severity={vulnerability.severity} />
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Category: {vulnerability.category}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography paragraph>{vulnerability.description}</Typography>

        <Typography variant="h6" gutterBottom>
          Impact
        </Typography>
        <Typography paragraph>{vulnerability.impact}</Typography>

        <Typography variant="h6" gutterBottom>
          Vulnerable Code Example
        </Typography>
        <CodeExample code={vulnerability.codeExample} title="Vulnerable Code" />

        <Typography variant="h6" gutterBottom>
          Secure Code Example
        </Typography>
        <CodeExample
          code={vulnerability.fixExample}
          title="Secure Implementation"
        />

        {vulnerability.references && vulnerability.references.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              References
            </Typography>
            <ul>
              {vulnerability.references.map((ref, idx) => (
                <li key={idx}>
                  <MuiLink href={ref} target="_blank" rel="noopener noreferrer">
                    {ref}
                  </MuiLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardActions sx={{ px: 3, pb: 3 }}>
        <GradientButton
          variant="contained"
          gradient="primary"
          startIcon={<SecurityIcon />}
          component={Link}
          {...{ to: "/contracts/upload" }}
        >
          Analyze Your Contract
        </GradientButton>
      </CardActions>
    </GlassCard>
  );
};

// Main Vulnerabilities Page Component
const VulnerabilitiesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVulnerability, setSelectedVulnerability] =
    useState<Vulnerability | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<
    Vulnerability[]
  >([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch vulnerabilities data
  useEffect(() => {
    const fetchVulnerabilities = async () => {
      try {
        setLoading(true);

        // Mock data for demonstration purposes
        // In a real application, you would fetch this from an API
        const mockVulnerabilities: Vulnerability[] = [
          {
            id: "SWC-101",
            name: "Integer Overflow and Underflow",
            description:
              "An overflow/underflow happens when an arithmetic operation reaches the maximum or minimum size of a type.",
            severity: "High",
            impact:
              "Arithmetic operations reaching the maximum or minimum size of a type will wrap around. For example, a uint8 type can only store values in the range [0,255]. If a value of 257 is stored in a uint8, it will actually store a value of 1. If a value of -1 is stored in a uint8, it will actually store a value of 255.",
            category: "Arithmetic",
            codeExample: `function transfer(address _to, uint256 _value) public {
  // Check if sender has enough
  require(balanceOf[msg.sender] >= _value);
  // Check for overflows
  require(balanceOf[_to] + _value >= balanceOf[_to]);
  // Subtract from the sender
  balanceOf[msg.sender] -= _value;
  // Add the same to the recipient
  balanceOf[_to] += _value;
}`,
            fixExample: `// Import SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Use SafeMath for uint256
using SafeMath for uint256;

function transfer(address _to, uint256 _value) public {
  // Check if sender has enough
  require(balanceOf[msg.sender] >= _value);
  // Subtract from the sender
  balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
  // Add the same to the recipient
  balanceOf[_to] = balanceOf[_to].add(_value);
}`,
            references: [
              "https://swcregistry.io/docs/SWC-101",
              "https://consensys.github.io/smart-contract-best-practices/attacks/arithmetic-issues/",
            ],
          },
          {
            id: "SWC-107",
            name: "Reentrancy",
            description:
              "One of the major dangers of calling external contracts is that they can take over the control flow. In the reentrancy attack, a malicious contract calls back into the calling contract before the first invocation is complete.",
            severity: "Critical",
            impact:
              "This may cause the different invocations of the function to interact in destructive ways. For example, the vulnerable contract may end up sending more Ether than intended or revealing sensitive data meant to be kept private.",
            category: "Control Flow",
            codeExample: `function withdraw(uint256 _amount) public {
  require(balances[msg.sender] >= _amount);
  
  (bool success, ) = msg.sender.call{value: _amount}("");
  require(success, "Transfer failed");
  
  balances[msg.sender] -= _amount;
}`,
            fixExample: `function withdraw(uint256 _amount) public {
  require(balances[msg.sender] >= _amount);
  
  balances[msg.sender] -= _amount;
  
  (bool success, ) = msg.sender.call{value: _amount}("");
  require(success, "Transfer failed");
}`,
            references: [
              "https://swcregistry.io/docs/SWC-107",
              "https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/",
            ],
          },
          {
            id: "SWC-115",
            name: "Authorization through tx.origin",
            description:
              "tx.origin is a global variable in Solidity which returns the address of the account that sent the transaction. Using this variable for authorization could make a contract vulnerable if an authorized account calls a malicious contract.",
            severity: "Medium",
            impact:
              "A malicious contract can forward a call from an authorized account to the vulnerable contract, tricking it into performing operations that the original account would not have intended.",
            category: "Authorization",
            codeExample: `function transferOwnership(address newOwner) public {
  // Vulnerable authorization check
  require(tx.origin == owner);
  owner = newOwner;
}`,
            fixExample: `function transferOwnership(address newOwner) public {
  // Secure authorization check
  require(msg.sender == owner);
  owner = newOwner;
}`,
            references: [
              "https://swcregistry.io/docs/SWC-115",
              "https://consensys.github.io/smart-contract-best-practices/development-recommendations/solidity-specific/tx-origin/",
            ],
          },
          {
            id: "SWC-103",
            name: "Floating Pragma",
            description:
              "Contracts should be deployed with the same compiler version and flags that they have been tested with thoroughly. Locking the pragma helps to ensure that contracts do not accidentally get deployed using a different compiler version with unfixed bugs.",
            severity: "Low",
            impact:
              "Different compiler versions may behave differently and introduce bugs that were not present in the original tested code.",
            category: "Compiler",
            codeExample: `pragma solidity ^0.8.0;

contract FloatingPragmaContract {
  // Contract code...
}`,
            fixExample: `pragma solidity 0.8.10;

contract LockedPragmaContract {
  // Contract code...
}`,
            references: [
              "https://swcregistry.io/docs/SWC-103",
              "https://consensys.github.io/smart-contract-best-practices/development-recommendations/solidity-specific/locking-pragmas/",
            ],
          },
          {
            id: "SWC-105",
            name: "Unprotected Ether Withdrawal",
            description:
              "Due to missing or insufficient access controls, malicious parties can withdraw Ether from a contract.",
            severity: "Critical",
            impact:
              "If access control is absent or insufficient, an attacker might be able to withdraw some or all Ether from the contract.",
            category: "Access Control",
            codeExample: `function withdrawFunds() public {
  msg.sender.transfer(address(this).balance);
}`,
            fixExample: `// Define an owner
address private owner;

constructor() {
  owner = msg.sender;
}

// Add access control
function withdrawFunds() public {
  require(msg.sender == owner, "Only owner can withdraw");
  msg.sender.transfer(address(this).balance);
}`,
            references: [
              "https://swcregistry.io/docs/SWC-105",
              "https://consensys.github.io/smart-contract-best-practices/development-recommendations/access-control/",
            ],
          },
        ];

        setVulnerabilities(mockVulnerabilities);
        setFilteredVulnerabilities(mockVulnerabilities);
        setError(null);
      } catch (err) {
        console.error("Error fetching vulnerabilities:", err);
        setError("Failed to load vulnerabilities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVulnerabilities();
  }, []);

  // Filter vulnerabilities when search term or filters change
  useEffect(() => {
    let result = [...vulnerabilities];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (vuln) =>
          vuln.name.toLowerCase().includes(search) ||
          vuln.description.toLowerCase().includes(search) ||
          vuln.category.toLowerCase().includes(search) ||
          vuln.id.toLowerCase().includes(search)
      );
    }

    // Apply severity filter
    if (selectedSeverity) {
      result = result.filter(
        (vuln) => vuln.severity.toLowerCase() === selectedSeverity.toLowerCase()
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(
        (vuln) => vuln.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredVulnerabilities(result);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedSeverity, selectedCategory, vulnerabilities]);

  // Get unique categories for filter
  const categories = [...new Set(vulnerabilities.map((vuln) => vuln.category))];

  // Calculate pagination
  const totalPages = Math.ceil(filteredVulnerabilities.length / itemsPerPage);
  const paginatedVulnerabilities = filteredVulnerabilities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Handle filter menu
  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  const handleSeverityFilter = (severity: string | null) => {
    setSelectedSeverity(severity);
    handleCloseFilterMenu();
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    handleCloseFilterMenu();
  };

  const handleClearFilters = () => {
    setSelectedSeverity(null);
    setSelectedCategory(null);
    setSearchTerm("");
    handleCloseFilterMenu();
  };

  const handleVulnerabilitySelect = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setSelectedVulnerability(null);
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <AnimatedElement animation="fadeIn">
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Smart Contract Vulnerabilities
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Learn about common vulnerabilities in smart contracts and how to avoid
          them.
        </Typography>
      </AnimatedElement>

      {/* Search and Filter Bar */}
      {!selectedVulnerability && (
        <AnimatedElement animation="slideUp" delay={0.1}>
          <GlassCard sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <TextField
                placeholder="Search vulnerabilities..."
                variant="outlined"
                size="small"
                fullWidth
                sx={{ flexGrow: 1, minWidth: { xs: "100%", sm: "300px" } }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleOpenFilterMenu}
                size="small"
              >
                {selectedSeverity || selectedCategory
                  ? "Filters Applied"
                  : "Filter"}
              </Button>

              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleCloseFilterMenu}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ px: 2, py: 1, fontWeight: "bold" }}
                >
                  Filter by Severity
                </Typography>
                <MenuItem onClick={() => handleSeverityFilter(null)}>
                  All Severities
                </MenuItem>
                <MenuItem onClick={() => handleSeverityFilter("Critical")}>
                  Critical
                </MenuItem>
                <MenuItem onClick={() => handleSeverityFilter("High")}>
                  High
                </MenuItem>
                <MenuItem onClick={() => handleSeverityFilter("Medium")}>
                  Medium
                </MenuItem>
                <MenuItem onClick={() => handleSeverityFilter("Low")}>
                  Low
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="subtitle2"
                  sx={{ px: 2, py: 1, fontWeight: "bold" }}
                >
                  Filter by Category
                </Typography>
                <MenuItem onClick={() => handleCategoryFilter(null)}>
                  All Categories
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ px: 2, py: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Menu>
            </Box>

            {/* Applied filters display */}
            {(selectedSeverity || selectedCategory) && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedSeverity && (
                  <Chip
                    label={`Severity: ${selectedSeverity}`}
                    onDelete={() => setSelectedSeverity(null)}
                    size="small"
                  />
                )}
                {selectedCategory && (
                  <Chip
                    label={`Category: ${selectedCategory}`}
                    onDelete={() => setSelectedCategory(null)}
                    size="small"
                  />
                )}
              </Box>
            )}
          </GlassCard>
        </AnimatedElement>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
            Loading vulnerabilities...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selected Vulnerability Detail View */}
      {!loading && !error && selectedVulnerability && (
        <AnimatedElement animation="fadeIn">
          <VulnerabilityDetail vulnerability={selectedVulnerability} />
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBackToList}
              startIcon={<ExpandMoreIcon sx={{ transform: "rotate(90deg)" }} />}
            >
              Back to List
            </Button>
          </Box>
        </AnimatedElement>
      )}

      {/* Vulnerabilities Grid */}
      {!loading && !error && !selectedVulnerability && (
        <>
          {paginatedVulnerabilities.length > 0 ? (
            <Grid container spacing={3}>
              {paginatedVulnerabilities.map((vulnerability, index) => (
                <Grid item xs={12} sm={6} md={4} key={vulnerability.id}>
                  <AnimatedElement animation="scale" delay={index * 0.05}>
                    <GlassCard
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Chip
                            icon={<BugIcon />}
                            label={vulnerability.id}
                            size="small"
                            sx={{ borderRadius: 1 }}
                          />
                          <SeverityChip severity={vulnerability.severity} />
                        </Box>

                        <Typography variant="h6" gutterBottom>
                          {vulnerability.name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {vulnerability.description}
                        </Typography>

                        <Chip
                          label={vulnerability.category}
                          size="small"
                          variant="outlined"
                        />
                      </CardContent>

                      <CardActions sx={{ p: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleVulnerabilitySelect(vulnerability)
                          }
                        >
                          Learn More
                        </Button>
                      </CardActions>
                    </GlassCard>
                  </AnimatedElement>
                </Grid>
              ))}
            </Grid>
          ) : (
            <GlassCard sx={{ p: 4, textAlign: "center", mt: 2 }}>
              <WarningIcon
                sx={{ fontSize: 40, color: "warning.main", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No vulnerabilities found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                No vulnerabilities match your current search or filter criteria.
                Try adjusting your filters.
              </Typography>
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </GlassCard>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Call to Action */}
      {!loading && !error && !selectedVulnerability && (
        <AnimatedElement animation="slideUp" delay={0.2}>
          <GlassCard sx={{ mt: 6, p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Ready to check your smart contract?
            </Typography>
            <Typography variant="body1" paragraph>
              Upload your smart contract code for a comprehensive security
              analysis.
            </Typography>
            <GradientButton
              variant="contained"
              size="large"
              startIcon={<SecurityIcon />}
              component={Link}
              {...{ to: "/contracts/upload" }}
            >
              Analyze Your Contract
            </GradientButton>
          </GlassCard>
        </AnimatedElement>
      )}
    </Box>
  );
};

export default VulnerabilitiesPage;
