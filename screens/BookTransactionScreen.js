import React from 'react';
import { Text,
   View,
   TouchableOpacity,
   TextInput,
   Image,
   StyleSheet,
  KeyboardAvoidingView ,
ToastAndroid,Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase'
import db from '../config.js'

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookID: '',
        scannedStudentID:'',
        buttonState: 'normal',
        transactionMessage: ''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookID: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentID: data,
          buttonState: 'normal'
        });
      }
      
    }

    initiateBookIssue = async()=>{
      //add a transaction
      db.collection("transactions").add({
        'studentID': this.state.scannedStudentID,
        'bookID' : this.state.scannedBookID,
        'date' : firebase.firestore.Timestamp.now().toDate(),
        'transactionType': "Issue"
      })
      //change book status
      db.collection("books").doc(this.state.scannedBookID).update({
        'bookAvailablity': false
      })
      //change number  of issued books for student
      db.collection("students").doc(this.state.scannedStudentID).update({
        'noOfBooksIssued': firebase.firestore.FieldValue.increment(1)
      })
      this.setState(
        {scannedBookID:'',
         scannedStudentID:''})
    }

    initiateBookReturn = async()=>{
      //add a transaction
      db.collection("transactions").add({
        'studentID': this.state.scannedStudentID,
        'bookID' : this.state.scannedBookID,
        'date' : firebase.firestore.Timestamp.now().toDate(),
        'transactionType': "Return"
      })
      //change book status
      db.collection("books").doc(this.state.scannedBookID).update({
        'bookAvailablity': true
      })
      //change number  of issued books for student
      db.collection("students").doc(this.state.scannedStudentID).update({
        'noOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
      })
      this.setState(
        {scannedBookID:'',
         scannedStudentID:''})
    }


    checkBookEligibility=async()=>{
      const bookRef = await db.collection('books').where('bookID', '==', this.state.scannedBookID).get()
      var transactionType = ''
      if(bookRef.docs.length==0){
          transactionType = 'false'
      }
      else{
          bookRef.docs.map((doc)=>{
              var book = doc.data()
              if(book.bookAvailablity){
                  transactionType = 'issue'
              }
              else{
                  transactionType = 'return'
              }
          })
      }
      return transactionType
  }

  checkStudentEligibilityForBookIssue=async()=>{
      const studentRef = await db.collection('students').where('studentID', '==', this.state.scannedStudentID).get()
      var isStudentEligibile = ''
      if(studentRef.docs.length==0){
          this.setState({
              scannedBookID:'',
              scannedStudentID:''
          })
          isStudentEligibile = false
          alert('The studentID does not exist')   
      }
      else{
          studentRef.docs.map((doc)=>{
              var student = doc.data()
              if(student.noOfBooksIssued<2){
                  isStudentEligibile = true
              }
              else{
                  isStudentEligibile = false
                  alert('The student have already issued two books')
                  this.setState({
                      scannedBookID:'',
                      scannedStudentID:''
                  })
              }
          })
      }
      return isStudentEligibile
  }

  checkStudentEligibilityForBookReturn=async()=>{
      const transactionRef = await db.collection('transactions').where('bookID', '==', this.state.scannedBookID).limit(1).get()
      var isStudentEligibile = '' 
      transactionRef.docs.map((doc)=>{
          var lastBookTransaction = doc.data()
          if(lastBookTransaction.studentID===this.state.scannedStudentID){
              isStudentEligibile = true
          }
          else{
              isStudentEligibile = false
              alert('The book was not issued by this student')
              this.setState({
                  scannedBookID:'',
                  scannedStudentID:''
              })
          }
      })
      return isStudentEligibile
  }

  handleTransaction=async()=>{
      var transactionType = await this.checkBookEligibility()
      if(!transactionType){
          alert('The book does not exist in the database')
          this.setState({
              scannedBookID:'',
              scannedStudentID:''
          })
      }
      else if(transactionType==='issue'){
          var isStudentEligibile = await this.checkStudentEligibilityForBookIssue()
          if(isStudentEligibile){
              this.initiateBookIssue()
              alert('Book issued to the student')
          }
      }
      else{
          var isStudentEligibile = await this.checkStudentEligibilityForBookReturn()
          if(isStudentEligibile){
              this.initiateBookReturn()
              alert('Book returned to the library')
          }
      }
    }


    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView  style={styles.container} behavior="padding" enabled>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text =>this.setState({scannedBookID:text})}
              value={this.state.scannedBookID}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText ={text => this.setState({scannedStudentID:text})}
              value={this.state.scannedStudentID}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async()=>{
                var transactionMessage = this.handleTransaction();
               
              }}>
          <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: '#FBC02D',
      width: 100,
      height:50
    },
    submitButtonText:{
      padding: 10,
      textAlign: 'center',
      fontSize: 20,
      fontWeight:"bold",
      color: 'white'
    }
  });