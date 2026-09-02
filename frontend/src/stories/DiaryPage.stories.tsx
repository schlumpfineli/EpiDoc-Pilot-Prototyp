import type { Meta, StoryObj } from "@storybook/react";
import DiaryPage from "../../app/diary/anfaelle/page";

const meta: Meta<typeof DiaryPage> = {
  title: "Seiten/Anfallstagebuch",
  component: DiaryPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #fafafa, #ffffff)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DiaryPage>;

export const Standard: Story = {
  render: () => <DiaryPage />,
};

