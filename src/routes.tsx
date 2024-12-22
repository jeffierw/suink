import { Header } from "@/components/header";
import { Section } from "@/components/section";
import { Footer } from "@/components/footer";
import { CreateSite } from "@/components/createSite/createSite";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PostsPage from "@/pages/PostsPage";
import SettingsPage from "@/pages/SettingsPage";
import EditPostPage from "@/pages/EditPostPage";
// import Post from "./components/dashboard/posts/Post";

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="mx-auto max-w-5xl min-h-screen">
            <Header />
            <Section />
            <Footer />
          </div>
        }
      />
      <Route path="/createSite" element={<CreateSite />} />

      <Route path="/dashboard/:id" element={<DashboardLayout />}>
        <Route index element={<PostsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="post" element={<EditPostPage />} />
      </Route>
      <Route path="/dashboard/:id/post" element={<EditPostPage />} />
    </Routes>
  );
};

export default AppRoutes;
