import { Dimensions, StyleSheet, SafeAreaView } from "react-native";

const { height } = Dimensions.get("screen");
const { width } = Dimensions.get("screen");

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "ghostwhite",
    paddingTop: SafeAreaView.statusBarHeight, // Add this line
  },
  label: {
    textAlign: "center",
    margin: 10,
  },

  address: {
    fontWeight: "bold",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.8,
  },
});
