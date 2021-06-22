module.exports = {
  "title": "",
  "description": "",
  "dest": "public",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "nav": [
      {
        "text": "首页",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "时间轴",
        "link": "/timeline/",
        "icon": "reco-date"
      },
      {
        "text": "关于我",
        "icon": "reco-message",
        "items": [
          {
            "text": "GitHub",
            "link": "https://github.com/jiyongchao-qf",
            "icon": "reco-github"
          }
        ]
      }
    ],
    "sidebar": {
      "/docs/theme-reco/": [
        "",
        "theme",
        "plugin",
        "api"
      ]
    },
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "栏目"
      },
      "tag": {
        "location": 3,
        "text": "标签"
      }
    },
    "friendLink": [
      {
        title: '文集',
        desc: '随感',
        logo: "book.jpg",
        link: 'https://www.wolai.com/p7EcXEWp3EsR9BeGRZWNgf?theme=dark'
      },
      {
        title: '掘金',
        desc: '不是前端的后端不是好全栈',
        logo: '/juejin.jpg',
        link: 'https://juejin.im/user/1345457965251991'
      }],
    "logo": "/logo.png",
    "search": true,
     // 自动形成侧边导航
    "subSidebar": 'auto',
    "sidebarDepth": 1,
    "displayAllHeaders": false,
    "searchMaxSuggestions": 10,
    "lastUpdated": "Last Updated",
    "author": null,
    "authorAvatar": "/avatar.jpg",
    "record": "xxxx",
    "startYear": "2017"
  },
  "markdown": {
    "lineNumbers": true
  }
}