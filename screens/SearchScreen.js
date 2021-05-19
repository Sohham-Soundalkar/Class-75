import React from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import db from '../config';

export default class Searchscreen extends React.Component {
  constructor(props){
    super(props);
    this.state={
      allTransactions: [],
      lastVisibleTransaction: null,
      search: ''
    }
  }

  fetchMoreTransactions=async()=>{
    var text = this.state.search.toUpperCase()
    var enteredText = text.split('')
    if(enteredText[0].toUpperCase()==='B'){
      const query = await db.collection('transactions').where('bookID', '==', text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
      query.docs.map((doc)=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
    else if(enteredText[0].toUpperCase()==='S'){
      const query = await db.collection('transactions').where('bookID', '==', text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
      query.docs.map((doc)=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
  }

  searchTransaction=async(text)=>{
    var enteredText = text.split('')
    if(enteredText[0].toUpperCase()==='B'){
      const transaction = await db.collection('transactions').where('bookID', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
    else if(enteredText[0].toUpperCase()==='S'){
      const transaction = await db.collection('transactions').where('studentID', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
  }

  componentDidMount=async()=>{
    const query = await db.collection('transactions').limit(10).get()
    query.docs.map((doc)=>{
      this.setState({
        allTransactions: [],
        lastVisibleTransaction: doc
      })
    })
  }

    render() {
      return (
        <View style={styles.container}>
          <View style={styles.searchBar}>
            <TextInput
            style={styles.bar}
            placeholder='Enter book ID or student ID'
            onChangeText={(text)=>{this.setState({
              search: text
            })}}
            />
            <TouchableOpacity style={styles.searchButton} onPress={()=>{this.searchTransaction(this.state.search)}}>
              <Text>Search</Text>
            </TouchableOpacity>
          </View>
          <FlatList
          data={this.state.allTransactions}
          renderItem={({item})=>(
            <View style={{borderBottomWidth: 2}}>
              <Text>{'book ID: ' + item.bookID}</Text>
              <Text>{'student ID: ' + item.studentID}</Text>
              <Text>{'transaction Type: ' + item.transactionType}</Text>
              <Text>{'date: ' + item.date.toDate()}</Text>
            </View>
          )}
          keyExtractor={(item, index)=>index.toString()}
          onEndReached={this.fetchMoreTransactions}
          onEndReachedThreshold={0.7}
          />
        </View>
      );
    }
  }

  const styles = StyleSheet.create({
    container:{
      flex: 1,
      marginTop: 35
    },
    searchBar:{
      flexDirection: 'row',
      height: 45,
      width: 'auto',
      borderWidth: 0.5,
      alignItems: 'center',
      backgroundColor: 'yellow'
    },
    bar:{
      borderWidth: 2,
      height: 35,
      width: 300,
      paddingLeft: 10
    },
    searchButton:{
      borderWidth: 1,
      height: 35,
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'red'
    }
  })