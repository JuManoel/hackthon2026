name: create-react-component
description: Generate a new React component following project architecture and strict TypeScript rules.

Instructions:

1 determine component responsibility

2 create file in appropriate directory

3 create functional component

4 define Props interface

5 import labels when needed

6 ensure no magic literals

7 ensure file passes lint and typecheck

Component template

```tsx
import { FC } from "react"

interface Props {}

export const ComponentName: FC<Props> = () => {
  return <div />
}
```
