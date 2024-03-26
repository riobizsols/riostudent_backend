import getConfig from '../Config'
import mongoose from "mongoose";
import path from 'path';
export const checkMongoServerStatus = () => {
  return {
    dbState: mongoose.STATES[mongoose.connection.readyState],
    availableConnections: mongoose.connections.length
  }
}

export const getMaximumConnection = () => {
  return getConfig('MONGO_CONNECTION_LIMIT') ? getConfig('MONGO_CONNECTION_LIMIT') : 100
}

export const mongoConnect = async () => {
  let tls = {}
  // if (getConfig('IS_DOCUMENT_DB') == 'YES') {
  //   tls = {
  //     tls: true,
  //     tlsAllowInvalidHostnames: true,
  //     tlsCAFile: path.join(__dirname, '../../rds-combined-ca-bundle.pem')
  //   }
  // }
  await mongoose.connect(getConfig('MONGO_URI'), {
    ...tls,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    maxPoolSize: getMaximumConnection(),
    minPoolSize: 5,
    maxIdleTimeMS: 1500
    // poolSize: 100,
    // maxIdleTimeMS:50000,
    // socketTimeoutMS:1080000,
    // serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 5 seconds
  });
  mongoose.set('debug', function (coll: any, method: any, query: any, doc: any, options: any) {
    let set = {
      coll: coll,
      method: method,
      query: query,
      doc: doc,
      options: options
    };
    console.log(`${coll}.${method}`, JSON.stringify(query), doc)
  });
  console.log("MongoDB Connected");
  return true
}

export const dbConnect = async () => {
  try {
    let mongoServerStatus: any = checkMongoServerStatus()
    // if (getConfig('IS_EC2') == 'YES' && mongoServerStatus.dbState == 'connected') {
    if (mongoServerStatus.dbState == 'connected') {
      return true
    } else {
      await mongoConnect()
      return true
    }
  } catch (err: any) {
    console.error(err.message);
  }
};

export const disconnectDB = async () => {
  return true
  // return await mongoose.connection.close()
}

export const dbDrop = () => {
  try {
    mongoose.connection.db.dropDatabase();
  } catch (error: any) {
    console.error(error.message);
  }
}

export const objectIdToString = (_id: any): string | Array<string> | null => {

  if (_id == null) {
    return null
  } else if (!Array.isArray(_id)) {
    if (typeof _id === 'object')
      return _id.toString()
    else return _id
  } else {
    let tempArray = []
    for (let i of _id) {
      tempArray.push(typeof i === 'object' ? i.toString() : i)
    }
    return tempArray
  }
}

export const stringToObjectId = (_id: any): mongoose.Types.ObjectId | Array<mongoose.Types.ObjectId> => {
  if (!Array.isArray(_id)) {
    if (typeof _id === 'string')
      return mongoose.Types.ObjectId(_id)
    else return _id
  } else {
    let tempArray = []
    for (let i of _id) {
      tempArray.push(typeof i === 'string' ? mongoose.Types.ObjectId(i) : i)
    }
    return tempArray
  }
}