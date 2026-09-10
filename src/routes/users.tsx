import type { ParentProps } from 'solid-js';

// A layout route: pairing users.tsx with the users/ directory nests every
// page inside it under this component. Pages bring their own headings.
export default function UsersLayout(props: ParentProps) {
  return <>{props.children}</>;
}
