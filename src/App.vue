<template>
  <Authenticator>
    <template v-slot="{ signOut }">
      <v-app>
        <!-- App Bar with Sign-out Button -->
        <v-app-bar color="primary" dark prominent>
          <v-app-bar-nav-icon>
            <v-icon>mdi-cloud</v-icon>
          </v-app-bar-nav-icon>

          <v-toolbar-title>StoreIT Cloud Storage</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-btn @click="signOut" color="white" variant="text">
            <v-icon left>mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </v-app-bar>

        <v-main>
          <v-container max-width="800px">
            <!-- Storage Metrics -->
            <v-card class="mb-6" color="primary" dark>
              <v-card-text class="text-center">
                <v-row align="center" justify="center">
                  <v-col cols="12" md="4">
                    <div class="text-h5">
                      {{ formatBytes(storageMetrics.total_size) }}
                    </div>
                    <div class="text-caption">Storage Used</div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-h5">{{ storageMetrics.total_files }}</div>
                    <div class="text-caption">Files Stored</div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-h5">
                      ₹{{ storageMetrics.monthly_cost }}/mo
                    </div>
                    <div class="text-caption">Estimated Cost</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Upload Section -->
            <v-card class="pa-6 mb-6" elevation="2">
              <v-row align="center">
                <v-col cols="12" md="8">
                  <v-file-input
                    v-model="selectedFile"
                    label="Select file to upload"
                    outlined
                    dense
                    hide-details
                    prepend-icon="mdi-upload"
                    accept="*"
                  ></v-file-input>
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    color="primary"
                    @click="uploadFile"
                    :disabled="!selectedFile"
                    block
                    elevation="2"
                  >
                    Upload
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>

            <!-- File List -->
            <v-card class="pa-6" elevation="2">
              <h2 class="mb-4 text-center">Your Files</h2>

              <div v-if="files.length === 0" class="text-center py-6">
                <v-icon size="64" color="grey">mdi-folder-open</v-icon>
                <p class="mt-2">No files found in your storage</p>
                <p class="text-caption">
                  Upload your first file to get started
                </p>
              </div>

              <v-list v-else class="file-list">
                <v-list-item v-for="file in files" :key="file.key" class="mb-4">
                  <div class="d-flex align-center" style="width: 100%">
                    <!-- File Icon -->
                    <v-icon
                      :color="getFileColor(file.key)"
                      size="x-large"
                      class="mr-4"
                    >
                      {{ getFileIcon(file.key) }}
                    </v-icon>

                    <div class="file-info flex-grow-1">
                      <div class="font-weight-bold">{{ file.key }}</div>

                      <!-- Action Buttons -->
                      <div class="d-flex mt-3">
                        <v-btn
                          v-if="canPreview(file.key)"
                          color="blue"
                          @click="previewFile(file.key)"
                          class="mr-2"
                          min-width="110"
                        >
                          <v-icon left>mdi-eye</v-icon>
                          Preview
                        </v-btn>

                        <v-btn
                          color="success"
                          @click="downloadFile(file.key)"
                          class="mr-2"
                          min-width="110"
                        >
                          <v-icon left>mdi-download</v-icon>
                          Download
                        </v-btn>

                        <v-btn
                          color="error"
                          @click="deleteFile(file.key)"
                          min-width="110"
                        >
                          <v-icon left>mdi-delete</v-icon>
                          Delete
                        </v-btn>
                      </div>

                      <!-- File Details -->
                      <div class="text-caption mt-2">
                        {{ formatBytes(file.size) }} •
                        {{ formatDate(file.last_modified) }}
                      </div>
                    </div>
                  </div>
                </v-list-item>
              </v-list>
            </v-card>
          </v-container>

          <!-- Preview Dialog -->
          <v-dialog v-model="previewDialog" max-width="800">
            <v-card>
              <v-toolbar color="primary" dark>
                <v-toolbar-title
                  >Preview: {{ previewFileName }}</v-toolbar-title
                >
                <v-spacer></v-spacer>
                <v-btn icon @click="previewDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <v-card-text class="text-center pa-4" style="min-height: 500px">
                <!-- Image Preview -->
                <v-img
                  v-if="previewType === 'image'"
                  :src="previewContent"
                  contain
                  max-height="450"
                ></v-img>

                <!-- PDF Preview -->
                <iframe
                  v-else-if="previewType === 'pdf'"
                  :src="previewContent"
                  width="100%"
                  height="500px"
                  frameborder="0"
                ></iframe>

                <!-- Text Preview -->
                <pre
                  v-else-if="previewType === 'text'"
                  style="
                    white-space: pre-wrap;
                    text-align: left;
                    max-height: 500px;
                    overflow: auto;
                  "
                  >{{ previewContent }}</pre
                >

                <!-- Unsupported Type -->
                <div
                  v-else
                  class="d-flex flex-column align-center justify-center"
                  style="height: 500px"
                >
                  <v-icon size="100" color="grey">mdi-file-question</v-icon>
                  <div class="text-h5 mt-4">Preview not available</div>
                  <div class="text-body-1 mt-2">
                    This file type cannot be previewed. Please download to view.
                  </div>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="justify-end">
                <v-btn color="primary" @click="downloadFile(previewFileName)">
                  <v-icon left>mdi-download</v-icon>
                  Download
                </v-btn>
                <v-btn @click="previewDialog = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-snackbar
            v-model="snackbar.show"
            :color="snackbar.color"
            timeout="3000"
          >
            {{ snackbar.text }}
          </v-snackbar>
        </v-main>
      </v-app>
    </template>
  </Authenticator>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { get, post } from "aws-amplify/api";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

const selectedFile = ref(null);
const files = ref([]);
const storageMetrics = ref({
  total_size: 0,
  total_files: 0,
  storage_gb: 0,
  monthly_cost: 0,
});
const snackbar = ref({ show: false, text: "", color: "success" });
const previewDialog = ref(false);
const previewFileName = ref("");
const previewContent = ref("");
const previewType = ref("");

// Get file type icon
function getFileIcon(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const icons = {
    pdf: "mdi-file-pdf",
    png: "mdi-file-image",
    jpg: "mdi-file-image",
    jpeg: "mdi-file-image",
    gif: "mdi-file-image",
    bmp: "mdi-file-image",
    txt: "mdi-file-document-outline",
    doc: "mdi-file-word",
    docx: "mdi-file-word",
    xls: "mdi-file-excel",
    xlsx: "mdi-file-excel",
    ppt: "mdi-file-powerpoint",
    pptx: "mdi-file-powerpoint",
    zip: "mdi-folder-zip",
    mp3: "mdi-music",
    mp4: "mdi-video",
    default: "mdi-file",
  };
  return icons[ext] || icons.default;
}

// Get file color
function getFileColor(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const colors = {
    pdf: "red",
    image: "amber",
    document: "blue",
    audio: "green",
    video: "purple",
    archive: "orange",
    default: "grey",
  };
  if (["png", "jpg", "jpeg", "gif", "bmp"].includes(ext)) return colors.image;
  if (["doc", "docx", "txt", "pdf"].includes(ext)) return colors.document;
  if (["mp3", "wav", "ogg"].includes(ext)) return colors.audio;
  if (["mp4", "avi", "mov"].includes(ext)) return colors.video;
  if (["zip", "rar", "7z"].includes(ext)) return colors.archive;
  return colors[ext] || colors.default;
}

// Check if file can be previewed
function canPreview(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const previewableTypes = ["png", "jpg", "jpeg", "gif", "bmp", "pdf", "txt"];
  return previewableTypes.includes(ext);
}

// Preview file
async function previewFile(fileKey) {
  try {
    previewFileName.value = fileKey;
    previewContent.value = "";
    previewType.value = "";

    const ext = fileKey.split(".").pop().toLowerCase();

    // Get file content
    const { body } = await post({
      apiName: "StoreITApi",
      path: "/download",
      options: {
        body: { file_key: fileKey },
      },
    }).response;

    const result = await body.json();

    // Handle different file types
    if (["png", "jpg", "jpeg", "gif", "bmp"].includes(ext)) {
      previewType.value = "image";
      previewContent.value = `data:image/${ext};base64,${result.content}`;
    } else if (ext === "pdf") {
      previewType.value = "pdf";
      const blob = base64ToBlob(result.content, "application/pdf");
      previewContent.value = URL.createObjectURL(blob);
    } else if (ext === "txt") {
      previewType.value = "text";
      previewContent.value = atob(result.content);
    } else {
      previewType.value = "unsupported";
    }

    previewDialog.value = true;
  } catch (error) {
    snackbar.value = {
      show: true,
      text: "Preview failed: " + error.message,
      color: "error",
    };
  }
}

// Convert base64 to Blob
function base64ToBlob(base64, contentType = "") {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

// Format file sizes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(dm) + " " + sizes[i];
}

// Format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Existing functions remain the same
async function uploadFile() {
  if (!selectedFile.value) return;

  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Content = reader.result.split(",")[1];
      const fileKey = selectedFile.value.name;

      const { body } = await post({
        apiName: "StoreITApi",
        path: "/upload",
        options: {
          body: { file_key: fileKey, file_content: base64Content },
        },
      }).response;

      const result = await body.json();
      snackbar.value = { show: true, text: result.message, color: "success" };
      await fetchFiles();
    };
    reader.readAsDataURL(selectedFile.value);
  } catch (error) {
    snackbar.value = { show: true, text: error.message, color: "error" };
  }
}

async function fetchFiles() {
  try {
    const { body } = await get({
      apiName: "StoreITApi",
      path: "/list",
    }).response;

    const result = await body.json();
    files.value = result.files;
    storageMetrics.value = result.storage_metrics;
  } catch (error) {
    snackbar.value = { show: true, text: error.message, color: "error" };
  }
}

async function downloadFile(fileKey) {
  try {
    const { body } = await post({
      apiName: "StoreITApi",
      path: "/download",
      options: {
        body: { file_key: fileKey },
      },
    }).response;

    const result = await body.json();
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${result.content}`;
    link.download = fileKey;
    link.click();
  } catch (error) {
    snackbar.value = { show: true, text: error.message, color: "error" };
  }
}

async function deleteFile(fileKey) {
  try {
    const { body } = await post({
      apiName: "StoreITApi",
      path: "/delete",
      options: {
        body: { file_key: fileKey },
      },
    }).response;

    const result = await body.json();
    snackbar.value = { show: true, text: result.message, color: "success" };
    await fetchFiles();
  } catch (error) {
    snackbar.value = { show: true, text: error.message, color: "error" };
  }
}

onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
.file-list {
  border-radius: 8px;
  border: 1px solid #eee;
  background-color: white;
}

.v-list-item {
  transition: background-color 0.3s;
  border-radius: 8px;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.v-list-item:last-child {
  border-bottom: none;
}

.v-list-item:hover {
  background-color: #f5f5f5;
}

.v-btn {
  min-width: 110px;
  display: flex;
  justify-content: center;
}

.v-btn__content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

.file-info {
  flex-grow: 1;
}
</style>
