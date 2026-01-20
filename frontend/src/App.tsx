import React from "react";
import { RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import { router } from "./routers";

const App: React.FC = () => {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        dedupingInterval: 30000,
      }}
    >
      <RouterProvider router={router} />
    </SWRConfig>
  );
};

export default App;
