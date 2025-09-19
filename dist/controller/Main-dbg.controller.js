sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, MessageToast, JSONModel) {
	"use strict";

	return BaseController.extend("myapp.controller.Main", {
		onInit: function() {
			// Initialize model for selected files
			var oModel = new JSONModel({
				selectedFiles: []
			});
			this.getView().setModel(oModel);

			// Enable camera capture for mobile devices
			this._setupMobileCameraCapture();
		},

		sayHello: function () {
			MessageBox.show("Hello World!");
		},

		_setupMobileCameraCapture: function() {
			// Set up mobile camera capture after the view is rendered
			setTimeout(() => {
				if (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) {
					var oFileUploader = this.byId("imageFileUploader");
					if (oFileUploader && oFileUploader.oFileUpload) {
						oFileUploader.oFileUpload.setAttribute("capture", "environment");
						oFileUploader.oFileUpload.setAttribute("accept", "image/*");
					}
				}
			}, 100);
		},

		onFileChange: function(oEvent) {
			var oFileUploader = oEvent.getSource();
			var oFile = oEvent.getParameter("files")[0];

			if (!oFile) {
				return;
			}

			// Validate file
			if (!this._validateFile(oFile)) {
				oFileUploader.clear();
				return;
			}

			// Add file to model
			var oModel = this.getView().getModel();
			var aFiles = oModel.getProperty("/selectedFiles");

			// Check if file already exists
			var bExists = aFiles.some(function(file) {
				return file.name === oFile.name && file.size === oFile.size;
			});

			if (bExists) {
				MessageToast.show(this.getResourceBundle().getText("fileAlreadySelected"));
				oFileUploader.clear();
				return;
			}

			aFiles.push({
				name: oFile.name,
				size: this._formatFileSize(oFile.size),
				file: oFile
			});

			oModel.setProperty("/selectedFiles", aFiles);

			// Show selected files section and enable upload button
			this.byId("selectedFilesBox").setVisible(true);
			this.byId("uploadButton").setEnabled(true);

			MessageToast.show(this.getResourceBundle().getText("itemAdded", [oFile.name]));

			// Clear the file uploader for next selection
			oFileUploader.clear();
		},

		_validateFile: function(oFile) {
			// Validate file type
			var sFileName = oFile.name;
			var sFileType = sFileName.split('.').pop().toLowerCase();
			var aAllowedTypes = ["jpg", "jpeg", "png", "gif"];

			if (aAllowedTypes.indexOf(sFileType) === -1) {
				MessageBox.error(this.getResourceBundle().getText("invalidFileType"));
				return false;
			}

			// Validate file size (10MB limit)
			if (oFile.size > 10485760) {
				MessageBox.error(this.getResourceBundle().getText("fileTooLarge"));
				return false;
			}

			return true;
		},

		_formatFileSize: function(iBytes) {
			if (iBytes === 0) return "0 Bytes";

			var k = 1024;
			var aSizes = ["Bytes", "KB", "MB", "GB"];
			var i = Math.floor(Math.log(iBytes) / Math.log(k));

			return parseFloat((iBytes / Math.pow(k, i)).toFixed(2)) + " " + aSizes[i];
		},

		onDeleteFile: function(oEvent) {
			var oList = oEvent.getSource();
			var oItem = oEvent.getParameter("listItem");
			var iIndex = oList.indexOfItem(oItem);

			var oModel = this.getView().getModel();
			var aFiles = oModel.getProperty("/selectedFiles");
			var sFileName = aFiles[iIndex].name;

			aFiles.splice(iIndex, 1);
			oModel.setProperty("/selectedFiles", aFiles);

			// Hide section if no files
			if (aFiles.length === 0) {
				this.byId("selectedFilesBox").setVisible(false);
				this.byId("uploadButton").setEnabled(false);
			}

			MessageToast.show(this.getResourceBundle().getText("itemRemoved", [sFileName]));
		},

		onUploadPress: function() {
			var oModel = this.getView().getModel();
			var aFiles = oModel.getProperty("/selectedFiles");

			if (aFiles.length === 0) {
				MessageToast.show(this.getResourceBundle().getText("noFilesToUpload"));
				return;
			}

			MessageToast.show(this.getResourceBundle().getText("uploadStarted"));

			// Upload each file
			aFiles.forEach((oFileData, index) => {
				this._uploadFile(oFileData.file, index);
			});
		},

		_uploadFile: function(oFile, iIndex) {
			// Create FormData for file upload
			var oFormData = new FormData();
			oFormData.append("file", oFile);
			oFormData.append("filename", oFile.name);
			oFormData.append("filesize", oFile.size);

			// Use XMLHttpRequest for file upload via proxy
			var xhr = new XMLHttpRequest();

			xhr.onload = () => {
				if (xhr.status === 200 || xhr.status === 201) {
					MessageToast.show(this.getResourceBundle().getText("uploadSuccess", [oFile.name]));
					this._removeUploadedFile(iIndex);
				} else {
					MessageBox.error(this.getResourceBundle().getText("uploadError", [oFile.name]));
				}
			};

			xhr.onerror = () => {
				MessageBox.error(this.getResourceBundle().getText("uploadError", [oFile.name]));
			};

			// Upload via proxy - this will be proxied to https://httpbin.org/post
			// Replace "/post" with your actual API endpoint path
			xhr.open("POST", "/post");
			xhr.send(oFormData);
		},

		_removeUploadedFile: function(iIndex) {
			var oModel = this.getView().getModel();
			var aFiles = oModel.getProperty("/selectedFiles");

			aFiles.splice(iIndex, 1);
			oModel.setProperty("/selectedFiles", aFiles);

			// Hide section if no files
			if (aFiles.length === 0) {
				this.byId("selectedFilesBox").setVisible(false);
				this.byId("uploadButton").setEnabled(false);
			}
		},

		onUploadComplete: function(oEvent) {
			// This event is fired by FileUploader component
			var iStatus = oEvent.getParameter("status");
			var sResponse = oEvent.getParameter("response");

			if (iStatus === 200 || iStatus === 201) {
				MessageToast.show(this.getResourceBundle().getText("uploadSuccess", ["file"]));
			} else {
				MessageBox.error(this.getResourceBundle().getText("uploadError", ["file"]));
			}
		}
	});
});
