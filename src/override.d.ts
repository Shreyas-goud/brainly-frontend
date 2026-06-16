
declare module 'react-masonry-css' {
  import * as React from 'react';

  interface MasonryProps extends React.HTMLAttributes<HTMLDivElement> {
    breakpointCols: number | { default: number; [key: number]: number };
    className?: string;
    columnClassName?: string;
  }

  class Masonry extends React.Component<MasonryProps> {}

  export default Masonry;
}

