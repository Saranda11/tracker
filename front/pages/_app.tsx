import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AuthProvider } from "../lib/auth";
import Layout from "../components/Layout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Pages that don't need the layout
  const noLayoutPages = ["/login", "/register"];
  const showLayout = !noLayoutPages.includes(router.pathname);

  return (
    <AuthProvider>
      {showLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="toast-container"
        toastClassName="text-sm"
      />
    </AuthProvider>
  );
}

export default MyApp;
