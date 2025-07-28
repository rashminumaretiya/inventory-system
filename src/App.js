import { BrowserRouter } from "react-router-dom";
import AllRoutes from "./routes";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@emotion/react";
import theme from "./shared/theme";
import { CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import store from "./store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Backups from "./presentation/Backups";

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId="1027066066194-5tqh7vt83mijpup2od7q5n29jthuhmfa.apps.googleusercontent.com">
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <BrowserRouter>
              <Toaster />
              <CssBaseline />
              <AllRoutes />
              {/* <Backups/> */}
            </BrowserRouter>
          </ThemeProvider>
        </Provider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
