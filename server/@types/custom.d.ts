import { IUser } from "../models/user.model";
import {Request} from "express"


declare global {
    namespace Express{
        interface Request{
            user?: IUser
        }
    }
}
/*
Your friend created a custom TypeScript declaration file to augment the type definition of the Express `Request` object. This is useful when you want to extend or modify the existing type definitions for third-party libraries, in this case, Express.

Let's break down the key components:

1. **`@types` Folder:**
   - The `@types` folder is a convention in TypeScript for storing type declaration files that extend or override existing type definitions for external packages or modules.
   - By placing the file in a folder named `@types`, TypeScript automatically recognizes it and includes the declarations without the need for explicit configuration.

2. **`.d.ts` Extension:**
   - The `.d.ts` file extension is a convention for TypeScript declaration files.
   - TypeScript declaration files contain type information for JavaScript code that lacks explicit type annotations. They help TypeScript understand the types used in external libraries or in your own code.

3. **`custom.d.ts` File Contents:**
   - The code in `custom.d.ts` is declaring a global namespace augmentation for the Express library.
   - The `declare global` block indicates that these declarations should be available globally throughout the application.

4. **`namespace Express`:**
   - `namespace Express` is creating a new namespace within the global scope, specifically for the `Express` library.

5. **`interface Request`:**
   - Inside the `Express` namespace, an interface named `Request` is declared. This interface extends the existing `Request` interface provided by the Express library.
   - The added property is `user?: IUser`, which means that `user` is an optional property of type `IUser` on the `Request` object.
   - This modification allows TypeScript to recognize the `user` property when using `Request` objects in your application.

6. **`IUser` Import:**
   - The `import { IUser } from "../models/user.model";` statement indicates that the `IUser` interface is being used from the specified path. This assumes there is an `IUser` interface defined in the `user.model.ts` file.

By creating this custom declaration file, your friend has effectively extended the type definition of the Express `Request` object to include the `user` property. This way, TypeScript understands that `user` is a valid property on `Request` objects, resolving the error you were encountering.

*/