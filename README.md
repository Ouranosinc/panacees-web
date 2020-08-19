# PANACÉES

## Requirements

Recent version of node and npm. Run `npm ci` in the folder to install dependencies.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


## Data conversion

If data is in wrong encoding: (E.g.)

`iconv -f iso-8859-1 -t utf-8 couts_adaptations.csv -o couts_adaptations_utf8.csv`

```
npm run build && rsync --info=progress2 -rz --delete build/* root@165.227.42.230:/var/www/html/
```