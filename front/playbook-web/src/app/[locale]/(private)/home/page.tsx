"use client";

import { Action } from "./components/action";

export const HomePage = () => {
  const actions = [
    {
      action: "make-matche-room",
      description: "make-matche-room-description",
      icon: "/icons/friendship.png",
      onClick: () => {},
    },
    {
      action: "make-post",
      description: "make-post-description",
      icon: "/icons/addition.png",
      onClick: () => {},
    },
    {
      action: "go-to-profile",
      description: "go-to-profile-description",
      icon: "/icons/avatar.png",
      onClick: () => {},
    },
    {
      action: "go-to-matches-posts",
      description: "go-to-matches-posts-description",
      icon: "/icons/view-files.png",
      onClick: () => {},
    },
  ];
  return (
    <div className="flex flex-col min-h-screen justify-center items-center py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          return <Action key={action.action} action={action} />;
        })}
      </div>
    </div>
  );
};

export default HomePage;
