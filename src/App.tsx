import { useEffect, useRef, useState } from "react";
import { Dial } from "./Dial";
import { produce } from "immer";
import anime from "animejs";

export const App = () => {
  const [pin, setPin] = useState({ value: [-1, -1, -1, -1], position: 0 });
  const dots = useRef([] as HTMLDivElement[]);
  useEffect(() => {
    dots.current.forEach((dot, i) => {
      const v = pin.value[i];
      anime({
        easing: "easeInQuad",
        targets: dot,
        backgroundColor: v == -1 ? "#FFF" : "#000",
        duration: 300,
      });
    });

    if (pin.position == 4) {
      const t = setTimeout(() => {
        setPin({ value: [-1, -1, -1, -1], position: 0 });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [pin]);

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        gap: "8px",
        height: "100%",
        width: "100%",
        alignItems: "center",
      }}
    >
      <h2
        style={{
          marginBottom: 0,
        }}
      >
        ENTER PIN
      </h2>
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
        }}
      >
        {pin.value.map((p, i) => (
          <div
            ref={(node) => {
              if (!node) return;
              dots.current[i] = node;
            }}
            style={{
              boxSizing: "border-box",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "6px solid black",
            }}
          />
        ))}
      </div>
      <Dial
        onUpdate={(number) => {
          console.log(number);
          setPin(
            produce((draft) => {
              draft.value[draft.position] = number;
              draft.position++;
            })
          );
        }}
      />
    </div>
  );
};
