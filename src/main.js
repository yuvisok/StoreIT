// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import { Amplify } from "aws-amplify";
import amplifyconfig from "./amplifyconfiguration.json";

// Vuetify imports
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { mdiFile, mdiDownload, mdiDelete, mdiUpload } from "@mdi/js";

Amplify.configure(amplifyconfig);

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    sets: {
      mdi: {
        file: mdiFile,
        download: mdiDownload,
        delete: mdiDelete,
        upload: mdiUpload,
      },
    },
  },
});

createApp(App).use(vuetify).mount("#app");
