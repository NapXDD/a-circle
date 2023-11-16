"use client";

import React, { MouseEventHandler, useEffect } from "react";
import s from "../styles/clock.module.css";

export default function Home() {
  useEffect(() => {
    let longmousedowntimeout: NodeJS.Timeout;
    let longmousedown = false;
    let is_mousedownvid = false;
    let earlymouseX: number, earlymouseY: number;

    const clockContainer = document.querySelector(`.${s.clock_container}`);
    clockContainer.addEventListener("mousedown", function (e: MouseEvent) {
      longmousedowntimeout = setTimeout(function () {
        longmousedown = true;
      }, 200);
      is_mousedownvid = true;
      earlymouseX = e.screenX;
      earlymouseY = e.screenY;
    });
    clockContainer.addEventListener("mouseup", function (event: MouseEvent) {
      clearTimeout(longmousedowntimeout);
      is_mousedownvid = false;
      window.ipc.invoke("settlenewpos", {
        x: event.screenX - earlymouseX,
        y: event.screenY - earlymouseY,
      });
    });
    clockContainer.addEventListener("mousemove", dragMouse);

    clockContainer.addEventListener("mouseleave", () => {
      if (is_mousedownvid) {
        is_mousedownvid = false;
        window.ipc.sendv2("settlemergency");
      }
    });

    function dragMouse(e: MouseEvent) {
      if (is_mousedownvid) {
        e = e;
        e.preventDefault();
        window.ipc.invoke("setnewpos", {
          x: e.screenX - earlymouseX,
          y: e.screenY - earlymouseY,
        });
      }
    }
  }, []);

  return (
    <div className={s.frame_container}>
      <div className={s.clock_container}></div>
      <div className={s.clock_frame}></div>
    </div>
  );
}
