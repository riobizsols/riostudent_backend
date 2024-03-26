import { Config } from '../Constant/Config'
export const isProduction: boolean = process.env.MODE === "production"

const getConfig = (prop: keyof typeof Config): any => {
    return isProduction ? process.env[prop] : Config[prop as keyof typeof Config];
};

export default getConfig

