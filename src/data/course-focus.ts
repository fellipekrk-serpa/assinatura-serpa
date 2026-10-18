import type { CoursePractice } from './course'

export interface CourseFocus {
  label: string
  bounds: [number, number, number, number]
  // A clipping region over the original bitmap, never a replacement letter/font.
  path: string
  region?: string
}
const focuses: Partial<Record<number, CourseFocus>> = {
  1: {
    label: 'S',
    bounds: [195, 0, 560, 610],
    path: 'M 552 338 C 440 378 174 506 235 565 C 292 635 640 345 567 307 C 516 278 313 285 340 237 C 380 176 628 52 724 16 L 574 243',
  },
  2: {
    label: 'erpa',
    bounds: [585, 235, 350, 315],
    path: 'M 704 286 L 602 537 M 752 334 Q 767 363 922 247',
    region:
      'M 590 337 L 639 300 L 665 298 L 672 315 L 711 278 L 737 285 L 730 314 L 760 295 L 768 345 L 663 365 L 589 374 Z',
  },
  5: {
    label: 'Fellipe',
    bounds: [145, 0, 550, 610],
    path: 'M 157 349 Q 275 298 451 282 M 234 234 Q 444 120 685 94 M 554 15 Q 430 231 252 600 M 597 296 L 665 260',
    region:
      'M 410 330 L 445 260 L 512 191 L 561 164 L 549 232 L 536 250 L 583 257 L 615 258 L 615 300 L 571 328 L 546 338 L 496 415 L 478 414 L 501 354 L 448 355 Z',
  },
  6: {
    label: 'Serpa',
    bounds: [510, 20, 565, 440],
    path: 'M 838 39 C 770 92 672 178 645 223 C 624 250 746 227 767 250 C 826 285 574 447 531 444 C 504 430 666 311 744 265 M 838 39 L 729 225 M 838 250 L 783 385 M 908 269 L 1060 246',
    region:
      'M 772 270 L 803 241 L 826 237 L 842 244 L 858 243 L 878 257 L 899 239 L 924 245 L 924 280 L 847 305 L 770 310 Z',
  },
  8: {
    label: 'Fellipe · nível superior',
    bounds: [125, 0, 695, 540],
    path: 'M 519 4 L 231 524 M 138 345 L 479 186 M 207 203 C 313 129 567 7 694 25 C 777 27 755 94 691 153 M 207 203 C 319 127 408 138 382 219 M 598 263 C 700 215 798 203 798 228 L 694 296',
    region:
      'M 402 293 L 445 206 L 528 119 L 561 116 L 540 178 L 513 218 L 553 211 L 584 218 L 621 204 L 622 265 L 559 305 L 472 440 L 448 440 L 484 334 L 402 319 Z',
  },
  9: {
    label: 'Serpa · nível inferior',
    bounds: [315, 300, 855, 305],
    path: 'M 645 310 L 530 346 C 571 360 696 380 645 434 C 590 495 380 628 339 569 C 315 529 441 448 608 410 M 792 360 L 717 553 M 831 394 C 914 374 1071 305 1149 326',
    region:
      'M 661 406 L 688 367 L 715 361 L 744 355 L 772 363 L 797 349 L 828 353 L 847 372 L 845 407 L 750 440 L 660 445 Z',
  },
}
export function getCourseFocus(sessionId?: number): CourseFocus | undefined {
  return sessionId ? focuses[sessionId] : undefined
}
export const FOCUSED_REPETITIONS = [8, 8, 4] as const
export function repetitionTarget(context?: CoursePractice): number | undefined {
  return context && getCourseFocus(context.sessionId)
    ? FOCUSED_REPETITIONS[context.stepIndex]
    : undefined
}
