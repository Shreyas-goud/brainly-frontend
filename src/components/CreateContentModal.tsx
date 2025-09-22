import { useState, useRef } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import { BACKEND_URL } from "../config";
import axios from "axios";

const ContentType = {
  Youtube: "youtube",
  Twitter: "twitter",
} as const;

type ContentTypeType = (typeof ContentType)[keyof typeof ContentType];

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateContentModal({ open, onClose }: CreateContentModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ContentTypeType>(ContentType.Youtube);

  async function addContent() {
    const title = titleRef.current?.value?.trim();
    const link = linkRef.current?.value?.trim();

    if (!title || !link) {
      alert("Please enter both title and link");
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/content`,
        {
          link,
          title,
          type,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onClose();
    } catch (err) {
      alert("Failed to submit");
      console.error(err);
    }
  }

  return (
    <div>
      {open && (
        <>
          <div className="fixed top-0 left-0 w-screen h-screen bg-slate-600 opacity-95" />

          <div className="fixed top-0 left-0 w-screen h-screen flex justify-center items-center">
            <div className="bg-white p-4 rounded max-w-md w-full">
              <div className="flex justify-end">
                <div onClick={onClose} className="cursor-pointer">
                  <CrossIcon />
                </div>
              </div>

              <div className=" ml-20 my-4">
                <Input reference={titleRef} placeholder="Title" />
                <Input reference={linkRef} placeholder="Link" />
              </div>

              <div className="mb-4">
                <h1 className="text-center font-medium mb-2">Type</h1>
                <div className="flex gap-2 justify-center">
                  <Button
                    text="YouTube"
                    variant={
                      type === ContentType.Youtube ? "primary" : "secondary"
                    }
                    onClick={() => setType(ContentType.Youtube)}
                  />
                  <Button
                    text="Twitter"
                    variant={
                      type === ContentType.Twitter ? "primary" : "secondary"
                    }
                    onClick={() => setType(ContentType.Twitter)}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={addContent}
                  variant="primary"
                  text="Submit"
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
