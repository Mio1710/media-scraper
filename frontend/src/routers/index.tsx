import { DefaultLayout } from "@/layouts/DefaultLayout";
import { MediaPage } from "@/pages/media";
import { ScaperPage } from "@/pages/scraper";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    element: <DefaultLayout />,
    children: [
      {
        path: "/",
        element: <ScaperPage />,
      },
      {
        path: "/media",
        element: <MediaPage />,
      },
    ],
  },
]);
