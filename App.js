import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TouchableHighlight, TextInput, ScrollView, Alert } from 'react-native';
import { theme } from './color';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

export default function App() {

  const STORAGE_KEY = "@toDos";
  const CURRENT_BTN = "@cureentBtn"; //마지막으로 사용한 탭 확인용

  const [working, setWorking] = useState(true);
  const [text, setText] = useState('');
  const [toDos, setToDos] = useState({});

  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');

  const travel = () => {
    setWorking(false)    
    AsyncStorage.setItem(CURRENT_BTN, JSON.stringify({ workbtn: false }));
  };
  const work = () => {
    setWorking(true)
    AsyncStorage.setItem(CURRENT_BTN, JSON.stringify({ workbtn: true }));
  };
  const onChangeText = (payload) => setText(payload); // text를 받아서 state에 담는다
  const onEditText = (payload) => setEditText(payload);

  const addToDo = async() => { // await saveToDos(newToDos)를 했으니 async 해줘야 한다
    if (text === "") {return;}
    //save to do (빈 object와 toDos에 새 todo 합치기)
    // const newToDos = Object.assign({},toDos, {[Date.now()]: { text, work: working },});
     const newToDos = { 
      ...toDos,  // toDos내용을 가진 새 object 생성, '...'을 이용하면 객체의 '내용'만 가져올 수 있다
      [Date.now()]: { text, working, done: false, edit: false }, 
      }; 
     setToDos(newToDos);
     await saveToDos(newToDos);
     setText("");
     console.log(toDos)
  }; 

  const saveToDos = async (toSave) => { //toSave에서 toDos를 받아옴 //await 해줬으니 async 줘야 함
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); // object -> string
  };
  const loadToDos = async () => {
    const s1 = await AsyncStorage.getItem(STORAGE_KEY);
    const s2 = await AsyncStorage.getItem(CURRENT_BTN); 
    //s !== null ? setToDos(JSON.parse(s)) : null;  // parse : string -> 자바스크립트 object  
    if (s1) {
      setToDos(JSON.parse(s1));
    }
    if (s2) {
      setWorking(JSON.parse(s2).workbtn);
    }
    //{"1690349563325":{"text":"공부","working":true,"done":false,"edit":false},
    //"1690349575785":{"text":"청소","working":true,"done":false,"edit":false},
    //"1690349581746":{"text":"양양","working":false,"done":false,"edit":false}}
  };

  useEffect(() => {
    loadToDos();
  }, []);

  const deleteToDo = (key) => {
    // if (Platform.OS === "web") {const ok = confirm("Do you want to delete this To Do?");
    //   if (ok) {
    //     const newToDos = { ...toDos };
    //     delete newToDos[key];
    //     setToDos(newToDos);
    //     saveToDos(newToDos);
    //   }
    // }
    Alert.alert("To Do 삭제", "해당 할일이 삭제됩니다", [
      { text: "취소" },
      {
        text: "삭제",
        //style: "destructive",  ios만 가능하다..
        onPress: () => {
          const newToDos = { ...toDos }; // 기존 toDos 내용으로 새 object를 만들었다
          delete newToDos[key]; // 해당 toDos의 key(id)를 삭제한다
          setToDos(newToDos); // state 업데이트
          saveToDos(newToDos); // AsyncStorage에 저장
        },
      },
    ]);
  };
  
  const editToDo = async (key) => {
    try {
      const newToDos = { ...toDos };
      if (editText === "" || editText === newToDos[key].text) {
        newToDos[key].edit = false;
        setToDos(newToDos);
        return;
      }
      newToDos[key].text = editText;
      newToDos[key].edit = false;
      setToDos(newToDos);
      await saveToDos(newToDos);
   }catch(e){null}
  };

  const setEditToDo = async (key) => {
    try {
      setEditMode(!editMode);

      if (editMode) {
        const newToDos = { ...toDos };
        newToDos[key].edit = true;
        setToDos(newToDos);
      } else {
        const newToDos = { ...toDos };
        newToDos[key].edit = false;
      }
      setToDos(newToDos);
    }catch(e){null}
  };

  const workDone = (key) => {
    const newToDos = { ...toDos };
    newToDos[key].done = !newToDos[key].done;
    setToDos(newToDos);
    saveToDos(newToDos);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}> 
        <TouchableOpacity activeOpacity={0.5} onPress={work}> 
          <Text style={{ ...styles.btnText, color: working ? "white" : theme.grey }} >Work</Text>
        </TouchableOpacity>
        <TouchableHighlight 
          //투명도 underlayColor="#DDDDDD"
          activeOpacity={0.6}
          onPress={travel}
          // onPress={() => console.log('pressed')}
        >
          <Text style={{ ...styles.btnText, color: !working ? "white" : theme.grey, }} >Travel</Text>
        </TouchableHighlight>
      </View>
      <View>
        <TextInput 
          onSubmitEditing={addToDo}
          onChangeText={onChangeText}
          style={styles.input} 
          value={text}
          returnKeyLabel = "done"
          placeholder={working ? "할일을 추가해보세요..." : "어디로 갈 예정인가요?"}
        >
        </TextInput>
      </View>
        <ScrollView>
        {Object.keys(toDos).map((key) =>
          toDos[key].working === working ? (
            <View style={styles.toDo} key={key}>
              {toDos[key].edit ? (
                <TextInput
                  onSubmitEditing={() => {editToDo(key);}}
                  onChangeText={onEditText}
                  defaultValue={toDos[key].text}
                  returnKeyType="done"
                  style={styles.editInput}
                ></TextInput>
              ) : (
                <Text
                  style={
                    toDos[key].done ? styles.workDoneText : styles.toDoText
                  }
                >
                  {toDos[key].text}
                </Text>
              )}
              <View style={{ flexDirection: "row" }}>                
               <TouchableOpacity onPress={() => workDone(key)}>
                  <Text style= {styles.icons}><FontAwesome name={toDos[key].done ? "check-square-o" : "square-o"} size={16} color='white' /></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditToDo(key)}>
                  <Text style= {styles.icons}><FontAwesome name="pencil-square-o" size={16} color='white' /></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteToDo(key)}>
                  <Text style= {styles.icons}><FontAwesome name="trash-o" size={16} color='white' /></Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal : 20,
  },
  header : {
    justifyContent : 'space-between',
    flexDirection : 'row',
    marginTop: 100,
  },
  btnText : {
    fontSize : 44,
    fontWeight: '600',  // 숫자에서 문자열로 변경
    color : '#fff',
  },
  input : {
    backgroundColor : 'white',
    height: 40,
    margin: 12,
    padding: 10,
    borderRadius : 20,
    fontSize : 18,
  },
  toDo : {
    backgroundColor : theme.grey,
    marginBottom : 10,
    paddingVertical : 20,
    paddingHorizontal : 20,
    borderRadius : 15,
    flexDirection : 'row',
    alignItems : 'center',
    justifyContent : 'space-between'
  },
  toDoText : {
    color : 'white',
    fontSize : 16,
    fontWeight: '500',  // 숫자에서 문자열로 변경
  },
  icons: {
    margin: 5,
  },
  workDoneText: {
    color: "black",
    fontSize: 16,
    textDecorationLine: "line-through",
  },
  editInput: {
    width: 180,
    fontSize: 16,
    fontWeight: '500',  // 숫자에서 문자열로 변경
    color: "white",
    borderBottomColor: "white",
    borderBottomWidth: 2,
  },
});