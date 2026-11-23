import type { ReactNode } from "react";
import { Card, CardBody, Heading, Text } from "@noldg/ui";

export interface AuthPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Composes a centered authentication page panel from shared design-system primitives. @param props Page heading, description, and content. */
export function AuthPanel({ title, subtitle, children }: AuthPanelProps) {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardBody className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <Heading level={1} size="lg">
            {title}
          </Heading>
          <Text tone="muted">{subtitle}</Text>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}
