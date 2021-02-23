import React from 'react';
import Contract from './Contract';
import customTheme from './theme.js'
// 1. Import the extendTheme function

import { ChakraProvider } from "@chakra-ui/react"
// 2. Extend the theme to include custom colors, fonts, etc
// const colors = {
//   brand: {
//     900: "#1a365d",
//     800: "#153e75",
//     700: "#2a69ac",
//   },
// }


//const theme = extendTheme({ customTheme })




function App() {
  console.log(customTheme);
  return (
    <ChakraProvider theme={customTheme}>
    <div className="App">
      <header className="App-header">
      </header>
        <Contract/>
    </div>
    </ChakraProvider>
  )
}

export default App;