require('dotenv').config();

const util = require('util');
const guid = require('node-uuid');
const storage = require('azure-storage');

const config = {
  useDevelopmentStorage: false,
  connectionString: process.env.CONNECTIONSTRING,
  accountName: process.env.ACCOUNTNAME,
  accountKey: process.env.ACCOUNTKEY,
  sas: process.env.SAS
};

const uploadFile = async (src, dest) => {
  const fileService = storage.createFileService(config);
  let shareName = dest.shareName + guid.v1(); // For Example : "demofileshare-" + guid.v1();
  let directoryName = dest.directoryName; // For Example : "demofiledirectory"
  let fileName = dest.fileName + src; // For Example "demobfile-" + src
  try {
    fileService.createShareIfNotExists(shareName, function (error) {
      if (error) {
        console.log(error)
      } else {
        // Create a directory under the root directory
        console.log('2. Creating a directory under the root directory');
        fileService.createDirectoryIfNotExists(shareName, directoryName, function (error) {
          if (error) {
            console.log(error);
          } else {
            // Create a directory under the just created directory
            let nextDirectoryName = directoryName + '/' + directoryName + '01';
            fileService.createDirectoryIfNotExists(shareName, nextDirectoryName, function (error) {
              if (error) {
                console.log(error);
              } else {
                // Uploading a local file to the directory created above
                console.log('3. Uploading a file to directory');
                fileService.createFileFromLocalFile(shareName, directoryName, fileName, src, function (error) {
                  if (error) {
                    console.log(error);
                  } else {
                    // List all files/directories under the root directory
                    console.log('4. List files/directories in root directory');
                    listFilesAndDirectories(fileService, shareName, directoryName, null, null, function (error, results) {
                      if (error) {
                        console.log(error);
                      } else {
                        for (let i = 0; i < results.files.length; i++) {
                          console.log(util.format('   - %s (type: file)'), results.files[i].name);
                        }
                        for (let j = 0; j < results.directories.length; j++) {
                          console.log(util.format('   - %s (type: directory)'), results.directories[j].name);
                        }

                        // Download the uploaded file to your file system
                        console.log('5. Download the uploaded file to your file system');
                        let downloadedImageName = util.format('CopyOf%s', src);
                        fileService.getFileToLocalFile(shareName, directoryName, fileName, downloadedImageName, function (error) {
                          if (error) {
                            console.log(error);
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    // output should be only the direct accessible url of the uploaded image (make images upload as public without encryption)
    // return IMAGE_FILE_URL;
  } catch (err) {
    throw err;
  }
}


/**
 * Lists file in the share.
 * @ignore
 *
 * @param {FileService}        fileService                         The file service client.
 * @param {string}             share                               The share name.
 * @param {object}             token                               A continuation token returned by a previous listing operation. 
 *                                                                 Please use 'null' or 'undefined' if this is the first operation.
 * @param {object}             [options]                           The request options.
 * @param {int}                [options.maxResults]                Specifies the maximum number of directories to return per call to Azure ServiceClient. 
 *                                                                 This does NOT affect list size returned by this function. (maximum: 5000)
 * @param {LocationMode}       [options.locationMode]              Specifies the location mode used to decide which location the request should be sent to. 
 *                                                                 Please see StorageUtilities.LocationMode for the possible values.
 * @param {int}                [options.timeoutIntervalInMs]       The server timeout interval, in milliseconds, to use for the request.
 * @param {int}                [options.maximumExecutionTimeInMs]  The maximum execution time, in milliseconds, across all potential retries, to use when making this request.
 *                                                                 The maximum execution time interval begins at the time that the client begins building the request. The maximum
 *                                                                 execution time is checked intermittently while performing requests, and before executing retries.
 * @param {string}             [options.clientRequestId]           A string that represents the client request ID with a 1KB character limit.
 * @param {bool}               [options.useNagleAlgorithm]         Determines whether the Nagle algorithm is used; true to use the Nagle algorithm; otherwise, false.
 *                                                                 The default value is false.
 * @param {errorOrResult}      callback                            `error` will contain information
 *                                                                 if an error occurs; otherwise `result` will contain `entries` and `continuationToken`. 
 *                                                                 `entries`  gives a list of directories and the `continuationToken` is used for the next listing operation.
 *                                                                 `response` will contain information related to this operation.
 */

// helper function 
function listFilesAndDirectories(fileService, share, directory, token, options) {
  var items = {
    files: [],
    directories: []
  };

  fileService.listFilesAndDirectoriesSegmented(share, directory, token, options, function (error, result) {
    items.files.push.apply(items.files, result.entries.files);
    items.directories.push.apply(items.directories, result.entries.directories);

    var token = result.continuationToken;
    if (token) {
      console.log('   Received a page of results. There are ' + result.entries.length + ' items on this page.');
      listFilesAndDirectories(fileService, share, directory, token, options);
    } else {
      console.log('   Completed listing. There are ' + items.files.length + ' files and ' + items.directories.length + ' directories.');
      console.log(null, items);
    }
  });
}

export default uploadFile;