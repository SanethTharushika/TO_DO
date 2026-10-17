# 📝 My To-Do App

A simple To-Do app for noting down today's, tomorrow's, and future work. Built with React Native (Expo) and published as a web app that can be installed on a phone's home screen.

🔗 **Live demo:** https://saneth-todo.netlify.app

## ✨ Features

- Add tasks and tag them as **Today**, **Tomorrow**, or **Later**
- Mark tasks as done (and undo)
- Delete tasks
- Tasks are saved on the device, so they stay after closing or refreshing
- Works on the web and can be added to an iPhone home screen like a normal app

## 🛠️ Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for saving tasks
- [Netlify](https://www.netlify.com/) for hosting

## 🚀 Run Locally

Make sure [Node.js](https://nodejs.org/) is installed, then:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME
npm install
npx expo start --web
```

The app opens in your browser at `http://localhost:8081`.

## 📦 Build for the Web

```bash
npx expo export --platform web
```

The finished site is created in the `dist` folder.

## 📱 Install on iPhone

1. Open the live link in **Safari**
2. Tap the **Share** button
3. Tap **Add to Home Screen**

## 🔮 Future Improvements

- [ ] Date picker for choosing any future date
- [ ] Edit existing tasks
- [ ] Group tasks by date
- [ ] Filters (All / Active / Done)
- [ ] Dark mode

## 👤 Author

**Saneth**
GitHub: (https://github.com/SanethTharushika)
