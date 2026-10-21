import { Platform } from "react-native";

export const handleEdges = () => {
    return Platform.OS === 'ios' ? ['top'] : ['top','bottom']
}

