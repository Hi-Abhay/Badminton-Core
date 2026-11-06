import { Platform } from "react-native";

export const handleEdges = () => {
    return Platform.OS === 'ios' ? ['top','left','right'] : ['top','bottom','left','right']
}

