import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import anime from "animejs";

function canvas2Cartesian(
  origin: { x: number; y: number },
  canvasCoordinates: { x: number; y: number }
) {
  return {
    x: canvasCoordinates.x - origin.x,
    y: -1 * (canvasCoordinates.y - origin.y),
  };
}

function quadrant(point: { x: number; y: number }): 1 | 2 | 3 | 4 {
  if (point.x >= 0 && point.y >= 0) return 1;
  else if (point.x < 0 && point.y >= 0) return 2;
  else if (point.x < 0 && point.y < 0) return 3;
  else if (point.x >= 0 && point.y < 0) return 4;
  debugger;
  throw new Error("invalid quadrant");
}

function cartesian2Polar(point: { x: number; y: number }) {
  point.y += 0.00001;
  let radians = Math.atan(point.y / point.x);

  switch (quadrant(point)) {
    case 1:
      break;
    case 2:
      radians += Math.PI;
      break;
    case 3:
      radians += Math.PI;
      break;
    case 4:
      radians += 2 * Math.PI;
      break;
  }
  return {
    r: Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2)),
    radians,
  };
}

function cartesian2Canvas(
  origin: { x: number; y: number },
  cartesianCoordinate: { x: number; y: number }
) {
  return {
    x: origin.x + cartesianCoordinate.x,
    y: origin.y - cartesianCoordinate.y,
  };
}

function polar2Cartesian(radius: number, radians: number) {
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  };
}

function arcCircle(origin: { x: number; y: number }, radius: number) {
  const start = cartesian2Canvas(origin, polar2Cartesian(radius, 0));

  const end = cartesian2Canvas(
    origin,
    polar2Cartesian(radius, (3 / 2) * Math.PI)
  );
  const d = [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 1 0 ${end.x} ${end.y}`,
  ].join(" ");
  return d;
}

function numberHoles(origin: { x: number; y: number }, radius: number) {
  const circles = [] as any[];
  const spacing = ((3 / 2) * Math.PI) / 10;
  const circleRadius = 20;
  for (let i = 0; i < 10; i++) {
    const canvas = cartesian2Canvas(
      origin,
      polar2Cartesian(radius, i * spacing + 0.05 * i)
    );
    circles.push(
      <circle cx={canvas.x} cy={canvas.y} fill="black" r={circleRadius} />
    );
  }
  return circles;
}

function numbers(origin: { x: number; y: number }, radius: number) {
  const circles = [] as any[];
  const spacing = ((3 / 2) * Math.PI) / 10;
  const circleRadius = 20;

  for (let i = 0; i < 10; i++) {
    const canvas = cartesian2Canvas(
      origin,
      polar2Cartesian(radius, i * spacing + 0.05 * i)
    );
    circles.push(
      <text
        x={canvas.x}
        y={canvas.y}
        dy={8}
        fill="white"
        textAnchor="middle"
        style={{
          fontSize: "24px",
          fontWeight: "800",
        }}
      >
        {i + 1 === 10 ? 0 : i + 1}
      </text>
    );
  }
  return circles;
}

function getNumber(rotation: number): number | undefined {
  if (rotation < Math.PI / 4) return undefined;
  const spacing = ((3 / 2) * Math.PI) / 10;
  let num = (rotation - Math.PI / 4) / spacing;
  num = Math.ceil(num);
  num = num > 9 ? 0 : num;
  return num;
}

export const Dial: FC<{
  onUpdate: (number: number) => void;
}> = ({ onUpdate }) => {
  const [origin, setOrigin] = useState({ x: 150, y: 150 });
  const [radius, setRadius] = useState(100);

  useLayoutEffect(() => {
    const width = window.innerWidth;
    if (width > 600) {
      setOrigin({
        x: width / 2,
        y: width * 0.15,
      });
      setRadius(width * 0.1);
    } else {
      setOrigin({
        x: width / 2,
        y: width * 0.5,
      });
      setRadius(width * 0.35);
    }
  }, []);

  const [svg, setSvg] = useState(null as null | SVGSVGElement);
  const [path, setPath] = useState(null as null | SVGPathElement);
  const pathRotationZ = useRef(0);
  const [cycleText, setCycleText] = useState(null as null | SVGTextElement);

  //mouse
  useEffect(() => {
    if (!path || !svg || !cycleText) return;
    svg.onmousedown = (event) => {
      event.preventDefault();
      const { top, left } = svg.getBoundingClientRect();
      let canvasP1 = { x: event.clientX - left, y: event.clientY - top };

      let cartesianP1 = canvas2Cartesian(origin, canvasP1);
      let polarP1 = cartesian2Polar(cartesianP1);

      if (polarP1.radians > 1.5 * Math.PI && polarP1.radians < 2 * Math.PI)
        return;

      const num = Math.ceil(polarP1.radians / (((3 / 2) * Math.PI) / 10));
      //   console.log(num > 9 ? 0 : num);

      let prevDeltaRadians = -0.01;
      svg.onmousemove = (event) => {
        event.preventDefault();
        const { top, left } = svg.getBoundingClientRect();

        const canvasP2 = { x: event.clientX - left, y: event.clientY - top };
        const cartesianP2 = canvas2Cartesian(origin, canvasP2);
        const polarP2 = cartesian2Polar(cartesianP2);

        let deltaRadians = polarP2.radians - polarP1.radians;
        if (prevDeltaRadians < 0 && deltaRadians > (3 / 2) * Math.PI) {
          deltaRadians = deltaRadians - 2 * Math.PI;
        }
        if (deltaRadians > 0) return;
        prevDeltaRadians = deltaRadians;
        pathRotationZ.current -= deltaRadians;
        path.style.transform = `rotateZ(${pathRotationZ.current}rad)`;

        const num = getNumber(pathRotationZ.current);
        if (num !== undefined) cycleText.innerHTML = `${num}`;
        else cycleText.innerHTML = `-`;

        //update
        canvasP1 = { x: event.clientX - left, y: event.clientY - top };
        cartesianP1 = canvas2Cartesian(origin, canvasP1);
        polarP1 = cartesian2Polar(cartesianP1);
      };
      svg.onmouseup = (event) => {
        event.preventDefault();
        const r = pathRotationZ.current;
        anime({
          targets: path,
          rotateZ: 0,
          complete: () => {
            pathRotationZ.current = 0;
          },
          duration: 700,
        });
        svg.onmouseup = null;
        svg.onmousemove = null;
        const num = getNumber(r);
        cycleText.innerHTML = "-";
        if (num !== undefined) onUpdate(num);
      };
    };
  }, [path, svg, cycleText]);

  //touch
  useEffect(() => {
    if (!path || !svg || !cycleText) return;
    svg.ontouchstart = (touchEvent) => {
      touchEvent.preventDefault();
      const [event] = touchEvent.touches;
      const { top, left } = svg.getBoundingClientRect();
      let canvasP1 = { x: event.clientX - left, y: event.clientY - top };

      let cartesianP1 = canvas2Cartesian(origin, canvasP1);
      let polarP1 = cartesian2Polar(cartesianP1);

      if (polarP1.radians > 1.5 * Math.PI && polarP1.radians < 2 * Math.PI)
        return;

      const num = Math.ceil(polarP1.radians / (((3 / 2) * Math.PI) / 10));
      //   console.log(num > 9 ? 0 : num);

      let prevDeltaRadians = -0.01;
      svg.ontouchmove = (touchEvent) => {
        touchEvent.preventDefault();
        const [event] = touchEvent.touches;
        const { top, left } = svg.getBoundingClientRect();

        const canvasP2 = { x: event.clientX - left, y: event.clientY - top };
        const cartesianP2 = canvas2Cartesian(origin, canvasP2);
        const polarP2 = cartesian2Polar(cartesianP2);

        let deltaRadians = polarP2.radians - polarP1.radians;
        if (prevDeltaRadians < 0 && deltaRadians > (3 / 2) * Math.PI) {
          deltaRadians = deltaRadians - 2 * Math.PI;
        }
        if (deltaRadians > 0) return;
        prevDeltaRadians = deltaRadians;
        pathRotationZ.current -= deltaRadians;
        path.style.transform = `rotateZ(${pathRotationZ.current}rad)`;

        const num = getNumber(pathRotationZ.current);
        if (num !== undefined) cycleText.innerHTML = `${num}`;
        else cycleText.innerHTML = `-`;

        //update
        canvasP1 = { x: event.clientX - left, y: event.clientY - top };
        cartesianP1 = canvas2Cartesian(origin, canvasP1);
        polarP1 = cartesian2Polar(cartesianP1);
      };
      svg.ontouchend = () => {
        touchEvent.preventDefault();
        const r = pathRotationZ.current;
        anime({
          targets: path,
          rotateZ: 0,
          complete: () => {
            pathRotationZ.current = 0;
          },
          duration: 700,
        });
        svg.onmouseup = null;
        svg.onmousemove = null;
        const num = getNumber(r);
        cycleText.innerHTML = "-";
        if (num !== undefined) onUpdate(num);
      };
    };
  }, [path, svg, cycleText]);
  return (
    <svg
      style={{
        userSelect: "none",
      }}
      width={"100%"}
      height={"100%"}
      ref={setSvg}
    >
      <defs>
        <mask
          id="circleHoles"
          x={"-20%"}
          y={"-20%"}
          width={"140%"}
          height="140%"
        >
          <rect width={"100%"} height="1000" x={0} y={0} fill="white" />
          {numberHoles(origin, radius)}
        </mask>
      </defs>
      <circle
        cx={origin.x}
        cy={origin.y}
        r={radius}
        fill="none"
        stroke="black"
        stroke-width={60}
      />
      <path
        transform-origin={`${origin.x} ${origin.y}`}
        ref={setPath}
        d={arcCircle(origin, radius)}
        stroke="white"
        stroke-width={50}
        fill="none"
        strokeLinecap="round"
        mask="url(#circleHoles)"
      />
      {numbers(origin, radius)}
      <circle
        cx={
          cartesian2Canvas(origin, polar2Cartesian(radius, (7 / 4) * Math.PI)).x
        }
        cy={
          cartesian2Canvas(origin, polar2Cartesian(radius, (7 / 4) * Math.PI)).y
        }
        r={10}
        fill="white"
      />
      <text
        ref={setCycleText}
        x={origin.x}
        y={origin.y}
        dy={12}
        fill="black"
        textAnchor="middle"
        style={{
          fontSize: "64px",
          fontWeight: "800",
        }}
      >
        -
      </text>
    </svg>
  );
};
