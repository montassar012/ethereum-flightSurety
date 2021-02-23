
import {theme  } from "@chakra-ui/theme";
//import { mode } from "@chakra-ui/theme-tools";
import { extendTheme } from "@chakra-ui/react";
import img from  "./flight.jpg";



// const customTheme= {
// //   ...theme,
// //   fonts: {
// //     ...theme.fonts,
// //     body: `"Source Sans Pro",${theme.fonts.body}`,
// //     heading: `"Source Sans Pro",${theme.fonts.heading}`,
// //   },
// //   colors: {
// //     ...theme.colors,
// //     black: "#131217",
// //   },

//   config: {
//     ...theme.config,
//     useSystemColorMode: false,
//     //initialColorMode: "light",
//   },
//   styles,
// };



const Container = {
    // The styles all button have in common
    baseStyle: {
      maxW: "100ch",
      mx: "auto",
      px: "1rem",
      w: "100%",
      marginTop: "20%",
      color: "white",
      bgColor: "rgb(0 0 0 / 72%)"
    },

      // Two sizes: sm and md
  sizes: {
    sm: {
      fontSize: "12px",
    //  padding: "16px",
    },
    md: {
      fontSize: "16px",
    //  padding: "24px",
    },
  },
    
    // Two variants: outline and solid
    variants: {
      outline: {
        border: "2px solid",
        borderColor: "black",
      },
      solid: {
        bg: "black",
        color: "white",
      },
    },
    // The default size and variant values
    defaultProps: {
      size: "md",
      variant: "outline",
    },
  }

const image=img;
console.log(img);
// Version 1: Using objects
const customTheme = extendTheme({
    components : {
        Container
    },
    styles: {
 
      global: {
        // styles for the `body`
        ".top-20" :{
            mt : "20px"
        },
        body: {
            bgImage: "url('"+image+"')",/* Source: iStockPhoto */
            bgRepeat: "no-repeat",
            bgSize: "cover", 

        },
        // styles for the `a`
        a: {
          color: "teal.500",
          _hover: {
            textDecoration: "underline",
          },
        },
      },
    },
    config: {
    ...theme.config,
    useSystemColorMode: false,
    initialColorMode: "dark",
  },
  })

export default customTheme;