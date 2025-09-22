import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CreateContentModal } from "../components/CreateContentModal";
import { PlusIcon } from "../icons/PlusIcon";
import { ShareIcon } from "../icons/ShareIcon";
import { Sidebar } from "../components/Sidebar";
import { useContent } from "../hooks/useContent";
import { BACKEND_URL } from "../config";
import axios from "axios";

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  type Content = {
    type: "twitter" | "youtube";
    link: string;
    title: string;
  };

  const { contents, refresh } = useContent() as {
    contents: Content[];
    refresh: () => void;
  };
  const [filter, setFilter] = useState<"all" | "twitter" | "youtube">("all");

  useEffect(() => {
    refresh();
  }, [modalOpen]);

  return (
    <div className="flex">
      <Sidebar onFilterChange={(filter) => setFilter(filter)} />

      <main className="flex-1 p-4 ml-24 md:ml-64 min-h-screen bg-gray-100">
        <CreateContentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        <div className="flex justify-end gap-4 mb-6">
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            text="Add Content"
            startIcon={<PlusIcon />}
          />

          <Button
            onClick={async () => {
              const response = await axios.post(
                `${BACKEND_URL}/api/v1/brain/share`,
                { share: true },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              const shareUrl = `http://localhost:5173/share/${response.data.hash}`;
              alert(shareUrl);
            }}
            variant="secondary"
            text="Share Brain"
            startIcon={<ShareIcon />}
          />
        </div>

        <div className="flex flex-wrap gap-4 pl-2">
          {contents
            .filter((c) => filter === "all" || c.type === filter)
            .map(({ type, link, title }) => (
              <Card key={link} type={type} link={link} title={title} />
            ))}
        </div>
      </main>
    </div>
  );
}
