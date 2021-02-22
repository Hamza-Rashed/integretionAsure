require('dotenv').config();
/**
 * Create a storage account in Azure
 * Create a new container
 */
const { BlobServiceClient } = require("@azure/storage-blob");
// Now do something interesting with BlobServiceClient

const config = {
  SASURL : process.env.SASURL
}

// Update <placeholder> with your Blob service SAS URL string
const blobSasUrl = config.SASURL;

// Create a new BlobServiceClient
const blobServiceClient = new BlobServiceClient(blobSasUrl);

// Create a unique name for the container by 
// appending the current time to the file name
const containerName = "container" + new Date().getTime();

// Get a container client from the BlobServiceClient
const containerClient = blobServiceClient.getContainerClient(containerName);

const uploadFiles = async (fileInput) => {
  try {
      console.log("Uploading files...");
      const promises = [];
      /**fileInput : is the html element (input type file) for upload the image */
      for (const file of fileInput.files) {
          const blockBlobClient = containerClient.getBlockBlobClient(file.name);
          promises.push(blockBlobClient.uploadBrowserData(file));
      }
      await Promise.all(promises);
      console.log("Done.");
  }
  catch (error) {
          console.log(error.message);
  }
}




























// const config = {
//   // api key / secret, or any needed data here
// };

// const uploadFile = async (src, dest) => {
//   try {

//     // output should be only the direct accessible url of the uploaded image (make images upload as public without encryption)
//     // return IMAGE_FILE_URL;
//   } catch (err) {
//     throw err;
//   }
// }



// export default uploadFile;
