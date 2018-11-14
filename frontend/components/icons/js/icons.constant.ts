export const IconsConstantModule = angular
	.module('3drepo')
	.constant('IconsConstant',
		/* tslint:disable:max-line-length */
		{
			extent: 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
			turntable1: 'M7.66 13.84h6.41a19 19 0 0 0 6.11-1.2 4.78 4.78 0 0 0 1.26-.71 1.46 1.46 0 0 0 .32-.39.39.39 0 0 0 0-.25 2 2 0 0 0-.78-.88 8.17 8.17 0 0 0-1.54-.79 23.59 23.59 0 0 0-7.22-1.33 28.77 28.77 0 0 0-6.42.46 10.15 10.15 0 0 0-4.14 1.57 2 2 0 0 0-.67.81.83.83 0 0 0-.06.31H.01a1.63 1.63 0 0 1 .09-.69 2.9 2.9 0 0 1 .91-1.27 11.12 11.12 0 0 1 4.52-2 30.1 30.1 0 0 1 6.79-.73 25.19 25.19 0 0 1 7.84 1.09 10 10 0 0 1 2 .9 3.77 3.77 0 0 1 1.7 2 2.43 2.43 0 0 1-.08 1.62A3.45 3.45 0 0 1 23 13.5a6.86 6.86 0 0 1-1.86 1.25 21.16 21.16 0 0 1-6.86 1.72c-1 .11-2 .15-2.77.17H9.45l-1.79.11v-2.91z',
			turntable2: 'M8.27 19.84v-9.12l-4.56 4.56 4.56 4.56',
			turntable3: 'M10.63 6.52h3.05v2.17h-3.05z',
			helicopter: 'M11.07 8.61h-.78A3.56 3.56 0 0 1 7.2 7.26a16.9 16.9 0 0 1-1.06-1.34 1.71 1.71 0 0 0-1.16-.77c-1-.17-2-.38-3-.57l-.39-.07a.9.9 0 0 1-.61-1.28.31.31 0 0 0 0-.34C.69 2.36.38 1.76.07 1.15-.06.9 0 .8.28.8a7.91 7.91 0 0 1 1 0 .89.89 0 0 1 .5.23c.51.55 1 1.12 1.5 1.62a.4.4 0 0 0 .22.1h4.41a.49.49 0 0 0 .25-.14.43.43 0 0 0 .14-.16.84.84 0 0 1 1-.59 1.53 1.53 0 0 0 .27 0v-.4H4A.56.56 0 1 1 4 .35h5.41a.28.28 0 0 0 .2-.06c.3-.41.56-.39.77.06h5.61a.56.56 0 1 1 0 1.11h-5.63v.42a4.87 4.87 0 0 0 .5 0 .62.62 0 0 1 .59.29.43.43 0 0 1 .08.11.85.85 0 0 0 .86.54A7 7 0 0 1 17.1 5.5a1.7 1.7 0 0 1 .4 1.23 1.46 1.46 0 0 1-.68 1.05 4.22 4.22 0 0 1-1.92.73.91.91 0 0 0-.74.48c-.06.1-.13.18-.21.3H16a1.57 1.57 0 0 0 .65-.2.62.62 0 0 0 .24-.36.58.58 0 0 1 .61-.43.55.55 0 0 1 .49.55 1.23 1.23 0 0 1-.35.86 2.12 2.12 0 0 1-1.6.71H7.13a.57.57 0 0 1-.63-.45.55.55 0 0 1 .6-.66h3.2a.42.42 0 0 0 .42-.21c.09-.16.21-.3.35-.49zm5.43-2.2a1.26 1.26 0 0 0-.35-.78 5.65 5.65 0 0 0-2.91-1.81c-.36-.1-.75-.13-1.15-.2v1.79a.29.29 0 0 0 .12.18c.31.24.62.49.94.71a.66.66 0 0 0 .35.12h3zm-3 2.19h-1.44a.14.14 0 0 0-.1 0l-.46.7h1.47a.2.2 0 0 0 .13-.08zm-11.18-5a.38.38 0 0 0-.39-.37.38.38 0 0 0 0 .76.38.38 0 0 0 .43-.35z',
			showAll: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
			isolate1: 'M12,6.5A9.76,9.76,0,0,1,20.82,12,9.82,9.82,0,0,1,3.18,12,9.76,9.76,0,0,1,12,6.5m0-2A11.83,11.83,0,0,0,1,12a11.82,11.82,0,0,0,22,0A11.83,11.83,0,0,0,12,4.5Z',
			isolate2: 'M12,7a5,5,0,1,0,5,5A5,5,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z',
			hide1: 'M0 0h48v48H0zm0 0h48v48H0zm0 0h48v48H0zm0 0h48v48H0z',
			hide2: 'M24 14c5.52 0 10 4.48 10 10 0 1.29-.26 2.52-.71 3.65l5.85 5.85c3.02-2.52 5.4-5.78 6.87-9.5-3.47-8.78-12-15-22.01-15-2.8 0-5.48.5-7.97 1.4l4.32 4.31c1.13-.44 2.36-.71 3.65-.71zM4 8.55l4.56 4.56.91.91C6.17 16.6 3.56 20.03 2 24c3.46 8.78 12 15 22 15 3.1 0 6.06-.6 8.77-1.69l.85.85L39.45 44 42 41.46 6.55 6 4 8.55zM15.06 19.6l3.09 3.09c-.09.43-.15.86-.15 1.31 0 3.31 2.69 6 6 6 .45 0 .88-.06 1.3-.15l3.09 3.09C27.06 33.6 25.58 34 24 34c-5.52 0-10-4.48-10-10 0-1.58.4-3.06 1.06-4.4zm8.61-1.57l6.3 6.3L30 24c0-3.31-2.69-6-6-6l-.33.03z',
			focus: 'M118.9,663.3H10v217.8C10,941.3,58.7,990,118.9,990h217.8V881.1H118.9V663.3z M118.9,118.9h217.8V10H118.9C58.7,10,10,58.7,10,118.9v217.8h108.9V118.9z M881.1,10H663.3v108.9h217.8v217.8H990V118.9C990,58.7,941.3,10,881.1,10z M881.1,881.1H663.3V990h217.8c60.2,0,108.9-48.7,108.9-108.9V663.3H881.1V881.1z M500,336.7c-90.1,0-163.3,73.2-163.3,163.3S409.9,663.3,500,663.3S663.3,590.1,663.3,500S590.1,336.7,500,336.7z'
            clip1: 'm0,0l24,0l0,24l-24,0l0,-24z',
            clip2: 'm17,15l2,0l0,-8c0,-1.1 -0.9,-2 -2,-2l-8,0l0,2l8,0l0,8zm-10,2l0,-16l-2,0l0,4l-4,0l0,2l4,0l0,10c0,1.1 0.9,2 2,2l10,0l0,4l2,0l0,-4l4,0l0,-2l-16,0z'
        }
		/* tslint:enable */
	);
