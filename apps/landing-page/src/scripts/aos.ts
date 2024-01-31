import AOS from "aos";

export function aosInit() {
  AOS.init({ duration: 1000, easing: "ease-out-cubic", once: true, offset: 50 });
}
