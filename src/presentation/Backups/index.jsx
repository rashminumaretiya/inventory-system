import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { ApiContainer } from "../../api";
import IMSDialog from "../../shared/IMSDialog";
import IMSButton from "../../shared/IMSButton";
import IMSTypography from "../../shared/IMSTypography";
import IMSBox from "../../shared/IMSBox";
import { LinearProgress } from "@mui/material";

const Backups = () => {
  const {apiResponse} = ApiContainer()
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false);
  const [tokenExpire, setTokenExpire] = useState(false);

  const fetchAllData = async () => {
    try {
      const [productResponse, vendorResponse, orderResponse] = await Promise.all([
        apiResponse("/product", "GET"),
        apiResponse("/venders", "GET"),
        apiResponse("/orders", "GET"),
      ]);

      setData({
        productList: productResponse?.data || [],
        vendersList: vendorResponse?.data || [],
        orders: orderResponse?.data || [],
      });
    } catch (error) {
      toast.error("Something went wrong while fetching data");
    }
  };

  // Function to upload the file to Google Drive
  const uploadBackup = async (access_token) => {
    setLoading(true)
    try {
      const folderId = "1X3AZkgrGzg8F6yB6bK8ex3NHLMgQPRvD"; // Your folder ID
      const date = new Date().toISOString().split("T")[0]; // Format date as YYYY-MM-DD

      // Metadata for the backup file
      const metadata = {
        name: `backup-${date}.json`, // Unique name for daily backups
        mimeType: "application/json",
        parents: [folderId],
      };

      // Create a Blob from the JSON data
      const file = new Blob([JSON.stringify(data)], { type: "application/json" });

      // Create a multipart request body
      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", file);

      // Make the request to Google Drive API
      await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        formData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      toast.success(`Backup for ${date} uploaded successfully!`);
      setLoading(false)
      setTokenExpire(false)
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      toast.error("Error uploading backup. Please try again.");
      setLoading(false)
    }
  };

  // Handle Google login success
  const handleLoginSuccess = async (response) => {
    const { access_token } = response;

    // Store token in localStorage for auto-login
    localStorage.setItem("googleAccessToken", JSON.stringify({token: access_token, expires_in: 24*60*60}));

    // Trigger the backup immediately after login
    await uploadBackup(access_token);
  };

  // Handle login failure
  const handleLoginFailure = (error) => {
    console.error("Login failed:", error);
    toast.error("Login failed. Please try again.");
  };

  // Google Login Hook
  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginFailure,
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  useEffect(() => {
    fetchAllData()
  }, []);

  // Auto-login logic
  useEffect(() => {
    const autoLoginAndBackup = async () => {
      const accessToken = JSON?.parse(localStorage.getItem("googleAccessToken"));
      if(!accessToken?.expires_in) {
          if (accessToken?.token) {
            await uploadBackup(accessToken?.token);
          } else {
            setTokenExpire(true)
            login();
          }
      }
    };

    // Schedule daily backups
    const backupInterval = setInterval(() => {
      fetchAllData()
      autoLoginAndBackup();
    }, 24 * 3600 * 1000);    

    autoLoginAndBackup();

    return () => clearInterval(backupInterval);
  }, [login]);

  return (
    <>
    <IMSDialog maxWidth="xs" open={tokenExpire} handleClose={()=> setTokenExpire(false)}>
      <IMSBox textAlign='center'>
        <IMSTypography variant="h5" mb={1}>Token Expire</IMSTypography>
        <IMSTypography variant="body1" mb={2}>Please upload backup manually</IMSTypography>
        {
          loading && <LinearProgress sx={{mb:3}} />
        }
        <IMSButton disabled={loading} onClick={login} variant="contained">Upload Backup</IMSButton>
      </IMSBox>
    </IMSDialog>
    </>
  );
};

export default Backups;
