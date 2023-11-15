import React from "react";

import s from "../styles/clock.module.css";

export default function Home() {
  return (
    <React.Fragment>
      <div className={s.clock_container}>
        <div className={s.clock_frame}></div>
      </div>
    </React.Fragment>
  );
}
